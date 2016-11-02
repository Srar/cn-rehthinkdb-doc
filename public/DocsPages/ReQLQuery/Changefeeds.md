# RethinkDB中的Changefeeds

___Changefeeds___是RethinkDB的实时功能核心。
这将允许当记录，表，甚至是特定查询被修改时通知给应用程序，几乎任何ReQL查询都可以使用changefeed。

## 基本使用
使用`changes`命令订阅表feeds:
```
r.table('users').changes().run(conn, function(err, cursor) {
  cursor.each(console.log);
})
```
`changes`命令会返回一个游标(就像`table`和`filter`命令一样)。你可以使用ReQL来迭代。
但是与其他的游标不同，当没有新记录时会阻塞当前线程(非JS语言)，直到你修改表或者修改记录的时候`changes`会返回一个对象。
假设你插入一个用户`{id: 1, name: Slava, age: 31}`到`users`表，RethinkDB会通知已经订阅`users`的changefeeds:
```
{
  old_val: null,
  new_val: {id: 1, name: 'Slava', age: 31}
}
```
这里`old_val`字段代表是记录更新前的数据, `new_val`字段是更新后的数据，在`insert`操作中`old_val`将为`null`,
`delete`操作`new_val`为`null`,`update`操作`new_val`和`old_val`都存在值。

## Point (single document) changefeeds
A “point” changefeed returns changes to a single document within a table rather than the table as a whole. 
```
r.table('users').get(100).changes().run(conn, callback);
```
The output format of a point changefeed is identical to a table changefeed.

## Changefeeds中使用filter与聚合查询
像其他ReQL一样, `changes`同样支持链式调用。你调用`changes`后再调用下列命令:

* filter
* getAll
* map
* pluck
* between
* union
* min
* max
* orderBy.limit

你也可以在记录序列返回之前调用`changes`(例如`count`和`orderBy`不能在`changes`之后) 
(You can also chain `changes` before any command that operates on a sequence of documents, as long as that command doesn’t consume the entire sequence. (For instance, `count` and `orderBy` cannot come after the `changes` command.))

假设你有个聊天应用，其中有个群功能，多个客户端会发送消息到群内，你可以只订阅关于这个群号的客户端发送事件
```
r.table('messages').filter(
  r.row('room_id').eq(ROOM_ID)
).changes().run(conn, callback)
```
你同样可以是用复杂的表达式，假设你有一个`scores`表存储每个玩家的最高分数，你可以订阅feed，当通知时只获取最高的分数:
```
r.table('scores').changes().filter(
    r.row('new_val')('score').gt(r.row('old_val')('score'))
)('new_val').run(conn, callback)
```
使用changefeeds有一些限制还有一些注意事项.
* `min`, `max`和`orderBy`必须和索引一起使用
* 使用`orderBy`需要同时使用`limit`
* `orderBy`必须使用索引或者主键：它不能使用在未定义的字段上?( it cannot be used with an unindexed field. )
* You cannot use changefeeds after concatMap or other transformations whose results cannot be pushed to the shards.
* 你不能在changefeed中`orderBy.limit`后使用`filter`
* Transformations are applied before changes are calculated.

## 包含 state changes

`changes`中的`includeStates`可选操作可以允许通知时包含额外"状态"信息，它允许你的应用程序区分从流开始和后续更改。
了解更多请点击[这里](https://www.rethinkdb.com/api/javascript/changes)

## 包含 initial values
如果`includeInitial`为`true`, the changefeed stream will start with the current contents of the table or selection being monitored.
`initial`结果会只包含`new_val`字段并不会包含`old_val`字段，所以你很容易从事件中区分它们。

If an initial result for a document has been sent and a change is made to that document that would move it to the unsent part of the result set (for instance, a changefeed monitors the top 100 posters, the first 50 have been sent, and poster 48 has become poster 52), an “uninitial” notification will be sent, with an `old_val` field but no `new_val` field. This is distinct from a delete change event, which would have a `new_val` of `null`.  (In the top 100 posters example, that could indicate the poster has been deleted, or has dropped out of the top 100.)

如果您将`includeStates`和`includeInitial`同时设置为`true`,那么changefeed开始会通知`{state: 'initializing'}`当`initial`通知完毕后将会通知`{state: 'ready'}`

## 包含 result types
如果`includeInitial`为`true`时将在事件中增加一个字段`type`, `type`字段可帮助你快速区分事件类型
* `add`: 新记录插入
* `remove`: 删除记录
* `change`: 修改记录
* `initial`: an initial value notification.
* `uninitial`: an uninitial value notification.
* `state`: 来自`includeStates`的记录(a status document from includeStates).

## Handling latency

Depending on how fast your application makes changes to monitored data and how fast it processes change notifications, 
it’s possible that more than one change will happen between calls to the `changes` command.
You can control what happens in that case with the `squash` optional argument.

By default, if more than one change occurs between invocations of `changes`, 
your application will receive a single change object whose `new_val` will incorporate all the changes to the data. 
Suppose three updates occurred to a monitored document between `change` reads:

| Change                    | Data                             | 
| ------------------------- |----------------------------------| 
| Initial state (`old_val`) | { name: “Fred”, admin: true }    | 
| update({name: “George”})  | { name: “George”, admin: true }  |   
| update({admin: false})    | { name: George, admin: false }   |
| update({name: “Jay”})     | { name: “Jay”, admin: false }    |      
| `new_val`                 | { name: “Jay”, admin: false }    |

Your application would by default receive the object as it existed in the database after the most recent change. The previous two updates would be “squashed” into the third.

If you wanted to receive all the changes, including the interim states, you could do so by passing `squash: false`.
The server will buffer up to 100,000 changes. 
(This number can be changed with the `changefeedQueueSize` optional argument.)

A third option is to specify how many seconds to wait between squashes. 
Passing `squash: 5` to the `changes` command tells RethinkDB to squash changes together every five seconds. 
Depending on your application’s use case, this might reduce the load on the server. 
A number passed to `squash` may be a float. 
Note that the requested interval is not guaranteed, but is rather a best effort.

____Note__: Changefeeds ignore the `read_mode` flag to `run`, 
and always behave as if it is set to `single` (i.e., the values they return are in memory on the primary replica,
but have not necessarily been written to disk yet). For more details read [Consistency guarantees](https://www.rethinkdb.com/docs/consistency).

## Scaling considerations

Changefeeds perform well as they scale, although they create extra intracluster messages in proportion to the number of servers with open feed connections on each write. 
This can be mitigated by running a RethinkDB proxy server (the `rethinkdb proxy` startup option); read [Running a proxy node](https://www.rethinkdb.com/docs/sharding-and-replication/#running-a-proxy-node) for details.

Since changefeeds are unidirectional with no acknowledgement returned from clients, they cannot guarantee delivery. 
If you need real-time updating with delivery guarantees, 
consider using a model that distributes to the clients through a message broker such as [RabbitMQ](https://www.rethinkdb.com/docs/rabbitmq/javascript/).

## 了解更多

* [changes](https://www.rethinkdb.com/api/javascript/changes) API说明
* [了解ReQL](/docs/2-1)
* [ReQL data types](https://www.rethinkdb.com/docs/data-types/)