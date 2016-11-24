# 故障排除 FAQ

## 我该如何从RethinkDB系统表内导出数据?
使用ReQL管理命令您可以便捷的导出数据. 如果您想导出单个系统表数据: `r.db('rethinkdb').table(<tablename>)`.

以下查询会输出最多50行内容. 其中包括各类配置, 状态, 以及日志表.

```javascript
r.expr(["current_issues", "jobs", "stats", "server_config", "server_status",
"table_config", "table_status", "db_config", "cluster_config"]).map(
    [r.row, r.db('rethinkdb').table(r.row).coerceTo('array')]
).coerceTo('object').merge(
    {logs: r.db('rethinkdb').table('logs').limit(50).coerceTo('array')}
)
```

## 当我尝试排序表数据时候发生了「ReqlResourceLimitError: Array over size limit 100000」错误
当没有使用索引进行排序时, RethinkDB会加载全部数据至数组. RethinkDB默认会限制数组最大元素个数为100,000个.
您可以在启动时指定`arrayLimit`选项来提高数组元素个数上线.
但是不管如何还是建议您使用索引来排序. 请阅读[orderBy](https://www.rethinkdb.com/api/javascript/order_by/)来了解更多信息.

## 插入速度很慢, 如何提高插入记录速度?
RethinkDB默认使用写确认来保证安全: 在客户端提交插入请求后, RethinkDB会在数据写入硬盘后才会通知客户端记录插入完毕.
如果您在一个单线程循环内插入数据到RethinkDB, 那每个插入请求都需要等待RethinkDB确认插入通知后再进行下一个记录插入, 这样会非常显著影响插入速度.


此行为类似于任何其他安全数据库系统.以下是您可以采取的若干步骤, 以加快RethinkDB中的插入性能.大多数这些准则也将适用于其他数据库系统.

* 并发插入: 您可以使用多个连接多个线程并发插入数据, 而不是在一个单线程内慢慢插.
* 批量插入: 不要循环一次就插一个记录, 而是一次循环组合数据插入. 批量插入可以显著提高吞吐量.
  
  __单次插入单条记录__:
  ```javascript
    r.db("foo").table("bar").insert(document_1).run()
    r.db("foo").table("bar").insert(document_2).run()
    r.db("foo").table("bar").insert(document_3).run()
  ``` 

  __单次批量插入记录__:
  ```javascript
  r.db("foo").table("bar").insert([document_1, document_2, document_3]).run()
  ```
  如果想获得RethinkDB插入最大性能, 您可以将需要插入的记录屯到200个左右时执行批量插入.

* __考虑使用软持久化模式(soft durability mode)__: 在此模式下RethinkDB接受到请求后就会立刻向客户端报告插入完毕.
  但此时记录暂存在服务器内存内, 然后再后台将内存内的新纪录写入至硬盘.

  这个对于默认模式hard durability mode来说, __使用soft durability mode不是很安全__. 如果您使用了soft durability mode又碰巧服务器断电了, 那么可能会丢失断电前几秒数据.

  您可以在插入记录时指定模式:

  ```javascript
  r.db("foo").table("bar").insert(document).run(durability="soft")
  ```

  > soft durability mode下断电可能会导致断电前几秒的数据丢失, 但是不会导致RethinkDB数据库损坏.

* __考虑使用`noreply`模式__: 

  在这个模式下, RethinkDB库不会等待实例通知写入成功, 而会直接进行下一个查询. 
  这个模式比soft durability mode更安全, 并且更能利用RethinkDB性能.您可以在插入记录时指定`noreply`模式:

  ```javascript
  r.db("foo").table("bar").insert(document).run(noreply=True)
  ```

  您可以同时使用`noreply`模式与soft durability mode来获取最高写入性能:

  ```javascript
  r.db("foo").table("bar").insert(document).run(durability="soft", noreply=True)
  ```

## 能对`group`输出的结果进行排序吗?
使用`group`后排序会对每个组都进行排序, 如果您想一次性排序全部组, 您需要在排序前调用[ungroup](https://www.rethinkdb.com/api/python/ungroup/).

## RethinkDB实例加入集群时提示 'received invalid clustering header'?
RethinkDB会占用机器三个端口分别作用是Web管理界面，应用程序通讯端口，实例集群通讯端口 
你可以在浏览器中打开Web管理界面通过浏览器快速管理RethinkDB
应用程序(列如一个nodejs应用)可以通过应用程序通讯端口来执行查询操作
当你启用集群模式时各个节点会使用实例集群通讯端口通讯

如果你启动集群实例时指定错端口则会发生'received invalid clustering header'提示

## Web管理界面支持的浏览器有哪些?
目前已知的浏览器兼容情况如下:
* Chrome 9 或更高
* Firefox 15 或更高
* Safari 6.02 或更高
* Opera 1.62 or 或更高

> Web管理界面需要您的浏览器支持`DataView`与`Uint8Array`javascript特性.

## 支持那些NodeJS版本?
NodeJS的RethinkDB库目前支持0.10.0或更高版本的NodeJS, 您可以通过以下命令来确认您的NodeJS版本:
```
node --version
```

您可以通过`npm`来便捷的升级您的NodeJS版本:

```
sudo npm install -g n
```

如果您尝试为祖传NodeJS版本安装RethinkDB库, 您可能会得到以下错误:

```
/home/user/rethinkdb.js:13727
return buffer.slice(offset, end);
             ^
TypeError: Object #<ArrayBuffer> has no method 'slice'
at bufferSlice (/home/user/rethinkdb.js:13727:17)
at Socket.TcpConnection.rawSocket.once.handshake_callback (/home/user/rethinkdb.js:13552:26)
```

## 我使用NodeJS RethinkDB库时回调内想获取连接对象.
许多人已经报告他们在运行查询时获取连接对象,对象是：

```json
{
    _conn: {
        host: 'localhost',
        port: 28015,
        db: undefined,
        authKey: '',
        timeout: 20,
        outstandingCallbacks: {},
        nextToken: 2,
        open: true,
        buffer: <Buffer 04 00 00 00 08 02 10 01>,
        _events: {},
        rawSocket: { ... }
    },
    _token: 1,
    _chunks: [],
    _endFlag: true,
    _contFlag: true,
    _cont: null,
    _cbQueue: []
}
```
然而这并不是一个连接对象, 而是一个游标. 如果您调用`next`, `each`或`toArray`其会返回查询结果.

举个例子, 假设您想获取全部查询结果并将结果全部丢进数组您可以使用`toArray`:

```javascript
r.table("test").run( conn, function(error, cursor) {
    cursor.toArray( function(error, results) {
        console.log(results) // result是一个记录数组, 而不是游标.
    })
})
```

## RethinkDB运行时发生out of memory
您可能需要通过`--cache-size`或者在配置文件中调整RethinkDB缓冲大小.
请阅读[Understanding RethinkDB memory requirements](#)来了解RethinkDB如何使用内存以及通过调整缓存来提高性能.

如果您再Linux上使用RethinkDB, 并且在系统issues表中看到了这样的警告: `Data from a process on this server has been placed into swap memory`.
而且您确定您服务器上内存是非常充足的, 那么您就需要调整内核参数:`swappiness`了.
当`swappiness`设置为0时内核会最大限度使用物理内存, 当为100时内核会积极使用swapn内存. 
您可以通过以下命令来查询`swappiness`内核参数:
```
$ cat /proc/sys/vm/swappiness
60
```
如果其为60(Ubuntu默认值)的话, 内核会再物理内存使用到40%就开始使用swap内存.
如果您想让内核当物理内存使用到90%再使用swap内存, 您可以将其设置为10.
您可以编辑`/etc/sysctl.conf`(需要root权限)文件来修改`swappiness`或者其他内核参数.
```
vm.swappiness = 10
```
当您修改后`swappiness`需要您重启系统后才会生效. 如您想保住您的400day uptime您可以使用以下命令无需重启即可生效:
```
$ sysctl vm.swappiness=10
$ swapoff -a
$ swapon -a
```

## ReQL内使用function if/for然后得到的结果不正确
当您将函数传递给ReQL时, 您使用的语言RethinkDB库会将函数序列化可在实例上执行的ReQL lambda函数. 并且其会在实例上运行, 而不是在客户端上.
(来阅读我们的blog了解更多lambda奇异技巧[All about lambda functions in RethinkDB queries](https://www.rethinkdb.com/blog/lambda-functions/))
如果您使用了编程语言的`if`或者`for`, 也许不会报错, 但是ReQL不会编译`if`与`for`, 这样就会导致其会客户端执行, 从而影响结果.
您必须使用ReQL中的[branch](https://www.rethinkdb.com/api/javascript/branch/)与[forEach](https://www.rethinkdb.com/api/javascript/for_each/)来代替`if`与`for`.
下面有个基于Python与Javascript的列子:

```python
# 错误! 使用了`if`来获取小余30岁的用户
r.table('users').filter(lambda user:
    True if user['age'] > 30 else False
).run(conn)

# 正确! 使用`r.branch`来获取小余30岁的用户
r.table('users').filter(lambda user:
    r.branch(user['age'] > 30, True, False)
).run(conn)
```

Javascript:

```javascript
// 错误! 使用了`if`来获取小余30岁的用户
r.table('users').filter(function(user) {
    return (r.row('age').gt(30) ? true : false);
}).run(conn, callback)

// 正确! 使用`r.branch`来获取小余30岁的用户
r.table('users').filter(function(user) {
    r.branch(user('age').gt(30), true, false)
}).run(conn, callback)
```

> Javascript中您必须是使用`gt`命令来代替js的`>`. 但在Python中有操作符重载所以就能够直接使用`>`了.

## 我该如何指定RethinkDB节点的非自身IP？
当一个RethinkDB实例启动并加入集群时, 实例会自动广播自身IP, 已便于集群内其他实例连接.
但是如果其中一个实例是处于内网, 那么内网的实例会广播自身的内网IP, 这样集群内其他实例就无法连接到内网的实例了.
如果是这种情况您可能会在日志中看到以下信息:
```
error: received inconsistent routing information (wrong address) from xxx.xxx.xxx.xxx (expected_address = peer_address{ips=[xxx.xxx.xxx.xxx], port=29015}, other_address = peer_address{ips=[xxx.xxx.xxx.xxx], port=29015}), closing connection
```

解决这个问题的办法很简单, 使用`--canonical-address`指定实例广播的IP

```
rethinkdb --canonical-address <external IP>
```
 
 `--canonical-address`同样也能够在[配置文件](/docs/6-2)中设置.

## 提示secondary index is outdated
在您升级RethinkDB后启动时可能会看到index outdated的信息:
```
warn: Namespace <x> contains these outdated indexes which should be recreated:
<index names>
```
看到了index outdated不要慌, 此时索引还能继续用, 并不会影响可用性. 但是我们还是建议您更新版本后重建下索引.

您可以使用`rethinkdb`的命令行工具来重建索引:
```
rethinkdb index-rebuild [-c HOST:PORT] [-r (DB|DB.TABLE)] [-n CONCURRENT_REBUILDS]
```
`-c`代表的是集群或者实例的IP与端口, `-r`代表需要重建那个数据库或那个数据库表的索引个. `-n`代表并发重建的数量(默认1).

您还可以在ReQL中手动重建索引:
* 使用[index_status](https://www.rethinkdb.com/api/python/index_status/)查询现有索引.
* 使用[index_create](https://www.rethinkdb.com/api/python/index_create/) 创建新索引.
* 使用[index_rename](https://www.rethinkdb.com/api/python/index_rename) 重命名并覆盖掉旧索引.

Python中您可以以下方式手动重建索引:

```python
old_index = r.table('posts').index_status('old_index').nth(0)['function'].run(conn)
r.table('posts').index_create('new_index', old_index).run(conn)
r.table('posts').index_wait('new_index').run(conn)
r.table('posts').index_rename('new_index', 'old_index', overwrite=True).run(conn)
```

这个例子也能在其他的`index_create`API文档中找到. [Ruby](https://www.rethinkdb.com/api/ruby/index_create); [Javascript](https://www.rethinkdb.com/api/javascript/index_create).

## 我该如何存储Ruby DateTime 对象至RethinkDB
简单暴力的回答: 很遗憾不能, 不过您可以使用`Time`来存储时间.

详细的回答: RethinkDB中只支持`Time`数据类型. 当编程语言支持多种时间对象时, 其可能会使开发者搞混. 所以我们认为库中支持其中一个就可以了.

您可以使用Ruby中的`DateTime.to_time`与`Time.to_datetime`方法来互相转换.

## Filters中使用`or`后返回结果不正确或者返回结果异常
您可能希望使用`filter`返回已设置了值的两个（或多个）可选字段之一的记录，如下所示:

```javascript
r.table('posts').filter(
    r.row('category').eq('article').or(r.row('genre').eq('mystery'))
).run(conn, callback);
```

但是这样写会有一个问题, 如果一个记录的`category`字段为空, 那么就不会进行后续对`genre`字段判断, 即使`genre`有值.
不过问题不是出在`or`上, 而是出在`r.row('category')`上. 如果`category`字段为空但是调用了`r.row('category')`就会使其返回一个错误, 然后就不会进行后续判断了.

解决办法很简单, 在`row`后面加一个`default`命令, 并将`default`的值不设置成您要判断的值. 这样简单暴力的方式就达成了当字段为空时返回`false`了.

```javascript
r.table('posts').filter(
    r.row('category').default('foo').eq('article').
    or(r.row('genre').default('foo').eq('mystery'))
).run(conn, callback);
```

## “Nesting depth limit exceeded”错误
通常这个错误代表JSON文档嵌套过深.

```json
{ "level": 1,
  "data": {
    "level": 2,
    "data": {
      "level": 3,
      "data": {
        "level": 4
      }
    }
  }
}
```
ReQL限制最大嵌套深度为20. 您可以通过未公开的`r.expr()`参数`nestingDepth`(或 `nesting_depth`)来修改最大嵌套深度. 但在您修改之前请重新重构JSON结构看看是否能够减少深度.

此错误也可能由循环引用引起, 其中文档无意中包含自身:

```javascript
user1 = { id: 1, name: 'Bob' };
user2 = { id: 2, name: 'Agatha' };
user1['friends'] = [ user1, user2 ];
```
当在ReQL中访问`user1`时就会出现Nesting depth limit exceeded错误.

根据不同编程语言的不同RethinkDB库来说这个错误也可能叫『Maximum expression depth exceeded.』

## “RqlTzinfo object is not JSON serializable” 错误
如果您尝试使用Python的`json`库来序列化包含ReQL时区对象的文档, 您可能会收到此错误. 请在`run`内指定`time_format="raw"`选项:

```python
import json
today = r.expr(datetime.datetime.now(timezone('US/Pacific'))).run(conn,
    time_format="raw")
json.dumps(today)

'{"timezone": "-07:00", "$reql_type$": "TIME", "epoch_time": 1433368112.289}'
```

## “Cannot use r.row in nested queries” 错误
Javascript与Python库支持一个非常方便的命令, `row()`, 其能够返回ReQL查询的当前行. 但是`row`不能在嵌套查询内使用. 解决此方法是将子查询重写为匿名函数:

```javascript
r.table('users').filter(
    r.row['name'] == r.table('prizes').get('winner')
).run(conn)
```
匿名函数版:

```javascript
r.table('users').filter(
    lambda doc: doc['name'] == r.table('prizes').get('winner')
).run(conn)
```

任何查询，嵌套或其他，可以用匿名函数来代替`row`(Ruby与Java的RethinkDB库根本就没`row`)
