# 查询性能优化
了解如何RethinkDB如何并行执行您的查询有时候可以提高您应用程序的响应速度.

## 分片
分片的基本规则是: 

___仅在某个特定操作需要的时候才会联合多个特定分片查询___

通俗的来说就是查询记录时候可能会在多个分片上进行查询

现在我们写个简单的查询，来了解下整个查询的大概过程:
```
r.table('users').filter({role: 'admin'}).run(conn, callback);
```
RethinkDB处理这个查询会有以下步骤:
* 将查询发送到查询服务端执行
* 在`users`表的每个分片中并行执行`filter`命令
* 将`filter`从每个分片中查询出的结果发送给查询服务器并合并结果
* 结果返回至客户端或者应用程序

但是`orderBy`命令操作没有索引的列时候和上面列子的步骤有点区别.
```
r.table('users').orderBy('username').run(conn, callback);
```
* 将查询发送到查询服务端执行
* 数据从各分片发送至查询服务端并合并
* 查询服务端执行`orderBy`命令
* 结果返回至客户端或者应用程序

当`orderBy`命令操作没有索引时候不能在每个分片中并行执行查询，需要全部表数据在一起才能进行排序.

下列命令可以在分片中并行查询:
* 选择: `between`, `get_all`, `filter`
* [Map-reduce](/2-5)操作: `map`, `concat_map`, `reduce`
* group
* Derived terms: `pluck`, `with_field`, `count`, `eq_join`,
* `order_by`使用索引时

ReQL中的链式查询命令的顺序也会导致性能影响. 先想想上面两个例子的一个是查询`admin`用户的，另一个是根据
`username`排序的。`filter`操作可以并行操作，然而`orderBy`并不可以。所以查询应该这样写
```
r.table('users').filter({role: 'admin'}).orderBy('name').run(conn, callback);
```
而不是这样:
```
r.table('users').orderBy('name').filter({role: 'admin'}).run(conn, callback);
```

以下命令会使后续链式调用命令不使用各分片并行查询:
* `order_by`(不管有没有索引)
* `distinct`
* `eq_join`
* `reduce`, `fold`
* `limit`, `skip`, `slice`
* `max`, `min`, `avg`

任何需要在查询服务端上处理的命令都只会在查询服务端上处理不会并行查询。所以尽量把可以并行查询的命令放在前面以减少后续需要集中处理的数据.

## 复制
RethinkDB默认情况下是数据安全性大于性能，. One of those defaults is that queries will be sent to the primary replicas for shards, which will always have current data (although that data may be returned to a query before it’s been committed to disk).

您可以通过`outdated`模式来提高性能，这将允许从集群内任何节点上获取记录.
```
r.table('users', {readMode: 'outdated'}).
  filter({role: 'admin'}).run(conn, callback);
```
使用`outdated`提高性能的同时也有缺点：可能你读取的记录与其他的节点记录不一样。
想了解RethinkDB中性能与数据安全性如何取舍请[点击这里](https://www.rethinkdb.com/docs/consistency/#balancing-safety-and-performance)

## 代理节点
当您启动时候指定了`proxy`命令时，RethinkDB将转换为集群内代理节点。代理节点会被当成查询服务端来负担节点与节点之间的通讯。如果您使用ChangeFeed那么代理节点可以消除重复的
ChangeFeed消息来提高集群性能.

想了解更多关于代理节点的信息请阅读[分片与复制](https://www.rethinkdb.com/docs/sharding-and-replication)