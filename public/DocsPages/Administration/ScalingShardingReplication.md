# 标记, 分片, 副本
RethinkDB允许您在集群中基于每个表来分片和副本. 
分片与副本您可以通过Web管理界面来设置.
另外可以使用ReQL命令设置表来达成更精确控制副本. 使用标记可以在用户定义的RethinkDB实例集群之间分发单个表副本.

# 多集群设置
如您在集群中有多个RethinkDB实例, 您可以使用`实例标签`来标记实例. 您可以在启动时标记一个或多个名字.
```
rethinkdb --server-tag data_center_1
```
一旦向RethinkDB实例提供了标记，那么可以使用`reconfigure`命令将标记分配给具有相同标记的RethinkDB实例. 文章下面将会大概讲解.

# 运行代理节点
如果您的RethinkDB集群中有很多实例，那么您可以运行___代理节点___来提高集群通讯效率, 并让您的应用程序连接至代理节点.

代理节点不会存储任何数据, 仅仅作为了一个查询路由器. 这样做会带来以下性能优势:
* 代理节点会将查询直接发送至正确的实例，减少了集群内通讯流量.
* 如果您使用了changfeeds代理节点也会自动删除从其他集群发送的changfeed消息从而减少流量.
* 代理节点可以处理查询本身，从而减少RethinkDB实例上CPU占用.

如您想运行代理节点可以在RethinkDB启动参数加入`proxy`命令:
```
rethinkdb proxy --join hostname:29015
```

# 通过Web管理界面来分片和副本
通过Web管理界面您可以非常方便分片以及副本, 您只需要指定需要分片的数量, 
RethinkDB会自动判断最佳分割点来保证分片数据平衡. 操作步骤如下:

* 前往 table view (Tables → 表名)
* 点击___Reconfigure___按钮
* 设置您需要的分片以及副本数量
* 点击___Apply Configuration___按钮

![alt](/DocsPages/images/shares_process.gif)

一个表最多可以有64个分片

# 通过ReQL来对表进行分片与副本
有3个主要命令在ReQL用于调整分片与副本. 另外可以通过系统表来修改lower-level values.
* [table_create](https://www.rethinkdb.com/api/python/table_create)可以在创建表时就指定分片与副本.
* [reconfigure](https://www.rethinkdb.com/api/python/reconfigure)可以更改已存在表的分片与副本.
* [rebalance](https://www.rethinkdb.com/api/python/rebalance)重写平衡表分片.

如您想了解关于更多使用ReQL来管理RethinkDB信息可以阅读API文档或者访问[管理工具](/docs/5-0).

> 目前RethinkDB划分分片是根据范围来划分，将来会使用hash来划分. 您可以[点击这里](https://github.com/rethinkdb/rethinkdb/issues/364)来查看进度.

# 高级设置
以下操作是无法通过Web控制界面完成的.

## 实例标签
您可以向RethinkDB实例集群内的实例标记零个或者多个标签.这些标签可以在表配置中用于将副本映射到由标签指定的实例。

您可以在实例启动参数内添加`--server-tag`选项来对实例标记标签:

```
rethinkdb --server-tag us --server-tag us_west
```

或者在实例运行时通过修改`rethinkdb.server_config`系统表来对实例标记标签:

```javascript
# get server by UUID
r.db('rethinkdb').table('server_config').get(
    'd5211b11-9824-47b1-9f2e-516a999a6451').update(
    {tags: ['default', 'us', 'us_west']}).run(conn)
```

如果您没有指定任何标签, 那么实例启动时会标记一个`default`标签. 当使用`default`标签时修改表分片或副本时会影响全部`default`标记实例.

> Web管理界面操作仅会对`default`标签实例生效. 如果您不使用`default`标签那么您无法在Web管理界面控制表分片或副本.

当您对实例标记标签后，您可以使用[reconfigure](https://www.rethinkdb.com/api/python/reconfigure)命令对特定标签实例进行操作.
假设我们为`users`表创建5个副本其中3个给`us_west`实例其中2个给`us_east`实例:

```python
r.table('users').reconfigure(shards=2, replicas={'us_west':3, 
    'us_east':2}, primary_replica_tag='us_east').run(conn)
```

如果您移除了一个实例的全部标签并且重新配置了表那么那个实例会从集群中离线.

```python
# 停用一个集群实例
r.db('rethinkdb').table('server_config').get(
    'd5211b11-9824-47b1-9f2e-516a999a6451').update(
    {tags: []}).run(conn)
r.db('database').reconfigure(shards=2, replicas=3).run(conn)
```

# 写入确认与写入持久化
写入确认与写入持久化这两个参数无法通过Web管理界面或者`reconfigure`来设置. 只能通过修改`table_config`系统表来达到修改这两个参数的目的

写入确认参数可以控制集群何时确认数据已写入. 其有两个值:
* `majority`: 每个查询在返回用户应答前，在集群中至少有两个拷贝，然后再通过一系列切换机制保障在节点故障发生切换时，数据不会丢失或错乱.
* `single`: 每个查询在返回用户应答前已经成功写入了集群内其中一个节点.

您可以通过这样来修改写入确认方式:

```javascript
r.db('rethinkdb').table('table_config').get(
    '31c92680-f70c-4a4b-a49e-b238eb12c023').update(
        {"write_acks": "single"}).run(conn)
```

写入持久化参数可以控制数据何时写入硬盘. 其有两个值:
* `hard`: 当成功写入硬盘后才会报告已成功写入
* `soft`: 当接受到数据时候就报告成功写入

`soft`比`hard`更快，但是`hard`比`soft`更安全.