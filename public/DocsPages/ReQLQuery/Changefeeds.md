# RethinkDB中的Changefeeds

___Changefeeds___是RethinkDB的实时功能核心. 
这将允许当记录，表，甚至是特定查询被修改时通知给应用程序，几乎任何ReQL查询都可以使用changefeed. 

## 基本使用
使用`changes`命令订阅表的更变信息:

```js
r.table('users').changes().run(conn, function(err, cursor) {
  cursor.each(console.log);
})
```

`changes`命令会返回一个游标(就像`table`和`filter`命令一样). 你可以使用ReQL来迭代. 
但是与其他的游标不同，当没有新记录时会阻塞当前线程(非JS语言)，直到你修改表或者修改记录的时候`changes`会返回一个对象. 
假设你插入一个用户`{id: 1, name: Slava, age: 31}`到`users`表，RethinkDB会通知已经订阅`users`的订阅者:

```js
{
  old_val: null,
  new_val: {id: 1, name: 'Slava', age: 31}
}
```

这里`old_val`字段代表是记录更新前的数据, `new_val`字段是更新后的数据，在`insert`操作中`old_val`将为`null`,
`delete`操作`new_val`为`null`,`update`操作`new_val`和`old_val`都存在值. 

## Point changefeeds
Point changefeeds仅仅会通知单个记录的更变消息, 而不是整个表内全部记录的更变消息.
```js
r.table('users').get(100).changes().run(conn, callback);
```
Point changefeeds的通知消息与整个表的changefeeds通知消息格式相同.

## Changefeeds中使用filter与聚合查询
像其他ReQL一样, `changes`同样支持链式调用. 你调用`changes`后再调用以下命令:

* [filter](https://www.rethinkdb.com/api/javascript/filter)
* [getAll](https://www.rethinkdb.com/api/javascript/get_all)
* [map](https://www.rethinkdb.com/api/javascript/map)
* [pluck](https://www.rethinkdb.com/api/javascript/pluck)
* [between](https://www.rethinkdb.com/api/javascript/between)
* [union](https://www.rethinkdb.com/api/javascript/union)
* [min](https://www.rethinkdb.com/api/javascript/min)
* [max](https://www.rethinkdb.com/api/javascript/max)
* [orderBy](https://www.rethinkdb.com/api/javascript/order_by).[limit](https://www.rethinkdb.com/api/javascript/limit)

你也可以在记录序列返回之前调用`changes`(例如`count`和`orderBy`不能在`changes`之后).

假设你有个聊天应用，其中有个群功能，多个客户端会发送消息到群内，你可以只订阅关于这个群号的客户端发送事件.

```js
r.table('messages').filter(
  r.row('room_id').eq(ROOM_ID)
).changes().run(conn, callback)
```

你同样可以是用复杂的表达式，假设你有一个`scores`表存储每个玩家的最高分数，你可以订阅feed，当通知时只获取最高的分数:

```js
r.table('scores').changes().filter(
    r.row('new_val')('score').gt(r.row('old_val')('score'))
)('new_val').run(conn, callback)
```
使用changefeeds有一些限制还有一些注意事项.
* `min`, `max`和`orderBy`必须和索引一起使用
* 使用`orderBy`需要同时使用`limit`
* `orderBy`必须使用索引或者主键：它不能使用在未定义的字段上?( it cannot be used with an unindexed field. )
* 您不能在`concatMap`命令或其他transformations操作后使用changefeeds. 应当在transformations操作前使用.
* 你不能在changefeed中`orderBy.limit`后使用`filter`

## 包含 state changes

`changes`命令中的`includeStates`可选参数可以允许通知时包含额外"状态"信息，它允许你的应用程序区分从流开始和后续更改. 
了解更多请点击[这里](https://www.rethinkdb.com/api/javascript/changes)

## 包含 initial values
`changes`命令中的`includeInitial`为可选参数`true`时, changefeed将会从当前表内容内或者选定的数据内开始监视.
`initial`结果会只包含`new_val`字段并不会包含`old_val`字段，所以你很容易从changefeed消息中区分它们. 

If an initial result for a document has been sent and a change is made to that document that would move it to the unsent part of the result set (for instance, a changefeed monitors the top 100 posters, the first 50 have been sent, and poster 48 has become poster 52), an “uninitial” notification will be sent, with an `old_val` field but no `new_val` field. This is distinct from a delete change event, which would have a `new_val` of `null`.  (In the top 100 posters example, that could indicate the poster has been deleted, or has dropped out of the top 100.)

如果您将`includeStates`和`includeInitial`同时设置为`true`,那么changefeed开始会通知`{state: 'initializing'}`当`initial`通知完毕后将会通知`{state: 'ready'}`

## 包含 result types
如果`includeInitial`为`true`时将在事件中增加一个字段`type`, `type`字段可帮助你快速区分事件类型
* `add`: 新记录插入
* `remove`: 删除记录
* `change`: 修改记录
* `initial`: initial 通知.
* `uninitial`: uninitial 通知.
* `state`: 来自`includeStates`状态记录.

## Handling latency

通过`changes`的`squash`可选参数可以更变changefeeds的通知时机, 默认情况下是立即通知. 例如:

| Change                    | Data                             | 
| ------------------------- |----------------------------------| 
| Initial state (`old_val`) | { name: “Fred”, admin: true }    | 
| update({name: “George”})  | { name: “George”, admin: true }  |   
| update({admin: false})    | { name: George, admin: false }   |
| update({name: “Jay”})     | { name: “Jay”, admin: false }    |      
| `new_val`                 | { name: “Jay”, admin: false }    |

当`squash`为`true`时, RethinkDB会默认等待N秒(通过`n`可选参数来设置), 在等待期间如果有新的消息, RehthinkDB会将多个消息通知压缩进一个通知内.

同时changefeeds也有通知消息堆积上限, 默认情况下是100,000, 您可以通过`changefeedQueueSize`可选参数来调整堆积上限.

__Note__: Changefeeds ignore the `read_mode` flag to `run`, 
and always behave as if it is set to `single` (i.e., the values they return are in memory on the primary replica,
but have not necessarily been written to disk yet). For more details read [Consistency guarantees](https://www.rethinkdb.com/docs/consistency).

## Scaling considerations

Changefeeds perform well as they scale, although they create extra intracluster messages in proportion to the number of servers with open feed connections on each write. 
This can be mitigated by running a RethinkDB proxy server (the `rethinkdb proxy` startup option); read [Running a proxy node](https://www.rethinkdb.com/docs/sharding-and-replication/#running-a-proxy-node) for details.

changefeeds并不带有确认机制, 这代表changefeeds可能会在特殊情况下丢失掉发送至您应用程序的部分消息. 
如果您需要有确认机制可以考虑使用[RabbitMQ](/#/Docs/8-2)作为应用程序和changefeeds中间的中间件.

## 了解更多

* [changes](https://www.rethinkdb.com/api/javascript/changes) API说明
* [了解ReQL](/docs/2-1)
* [ReQL数据类型](/#/Docs/3-0)