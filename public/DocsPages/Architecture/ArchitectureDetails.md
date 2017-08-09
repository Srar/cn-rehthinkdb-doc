# 构架 FAQ

**RethinkDB如何把表分割成分片**

RethinkDB针对主键使用a range sharding algorithm parameterized来分割数据.
当你设置分片时RethinkDB会检查表状态之后再基于表主键来均匀分割表.

接下来会举一个的例子: 假设你有一个1000行记录的表, 表主键是均匀分布的大写字母. 
然后你想让这个表变成两个分片, 此时RethinkDB很大程度会定位到字母'M'上来对左右数据进行分割操作.
小于字母或等于'M'的主键记录会进入第一个分片, 大于字母'M'的会进入第二个分片.

即使你的主键不是均匀分布的值(假设像是名字的姓一样, 其中一些姓占有率会大部分高于一些),
RethinkDB任然会选出合适的分割点使每个分片尽可能的保持同样数量.

当设置完毕后分割点就不会自动改变了, 但随着时间推移数据不断增加可能会导致各分片之间记录数量开始出现差距.
此时你可以重新设置分片来达到平衡分片. 

> 目前不支持手动指定分片分割点

Internally this approach is more difficult to implement than the more commonly used consistent hashing, but it has significant advantages because it allows for an efficient implementation of range queries.

** 如何在集群中分配相应的分片或副本至集群节点 **

分片与副本是通过__table configurations__设置的, __table configurations__可以让你非常方便的指定单个表与数据库中全部表的分片和副本.
你不需要人肉管理集群下的每个节点内的表, RethinkDB会使用启发式算法针对设置进行最优调度.

正对副本还有更细致的控制: 您可以使用__server tags__来讲副本与服务器实例绑定.
一个服务器实例可能会被设置一个或多个标签, 同时每个表副本可以被指定带有数量的标签(every table may have a specified number of replicas assigned to a server tag). 假设你有六个服务器实例其中标签分配如下:
```json
{
    "server01": ["us_west", "us"],
    "server02": ["us_west", "us"],
    "server03": ["us_east", "us"], 
    "server04": ["us_east", "us"],
    "server05": ["london"],
    "server06": ["london"]
}
```

我们可以使用`reconfigure`来要求RethinkDB将副本分配到那些实例上:
```javascript
r.table('a').reconfigure(shards=2, replicas={'us_east':2, 'us_west':2,
    'london':2}, primary_replica_tag='us_east')
r.table('b').reconfigure(shards=2, replicas={'us':2, 'london':1},
    primary_replica_tag='london')
```
表`b`中指定了两个副本存在于带有`us`标签的实例上. 由于集群内有4个实例带有`us`标签, 所以被指定的两个副本可能存在于任意两个实例上.

> Web界面目前无法针对标签进行操作, 这意味着如果您想使用标签您必须使用ReQL来操作.

**RethinkDB是否会在无用户操作之下自动调整集群?**

不会, RethinkDB的集群系统在被设计之初有3个主要原则:
* 常用操作例如调整分片或者副本数量我们会提供一个按钮来方便操作.
* 在一些特别情况下我们也提供了ReQL来供您更细度的调整. 例如将主副本手动指定在集群内的某个节点上.
* 有关调整集群或者获取集群信息您都可以使用ReQL来操作.

目前我们认为自动调整集群是一个层级更高的组件, 但是我们需要先把底层组件搞好才有心情搞高层级的组件.
目前集群系统分为三层:

* 第一层是分布式的基础组件: 自动路由查询, 副本放置到集群节点等.
* 第二层是实现分布式自动化的组件: 自动拆分表作为分片, 自动传输表副本, 自动确定主副本.
* 第三层是基于上面两层给用户提供ReQL或者Web界面来更方便的操作集群.

自动化调整集群是属于第四层, 目前用户可以自行编写程序来达到类似效果.

目前我们正在考虑是否可以自动执行用户给定的一个规则来达到类似自动调整集群的效果.

## CAP

**RethinkDB是否是强一致性?**

RethinkDB中的每一个分片都会被指定一个主副本. 默认情况下为了保证数据读写的正确性对分片的全部读写操作都会经过主副本.
主副本内数据一直保持一致性与无冲突并且在写操作成功后才能读到写入数据, 但如果主副本失效那么读写操作均会失效.

RethinkDB支持up-to-date与out-of-date读取. 默认情况下全部的读操作都是up-to-date, 
这意味着在读取操作下每个操作都要经由主副本确认来保证返回的数据是一致的.
您也可以使用out-of-date来读取数据, 此时读操作会请求最近的副本来牺牲一致性来换取更好的性能以及更高的可用性.

**RethinkDB在CAP中做了哪些权衡?**

CAP定理提出的问题主要是在网络分裂(netsplit)下是否能保证可用性或者一致性. 
RethinkDB选择了后者数据一致性.

基于Dynamo系统列如: Cassandra, Riak选择了保证可用性. 
在这些系统中如果遭遇到了网络分裂, 客户端依然可以往网络分裂的两侧来写入数据. 
以此带来的代价就是这些软件需要处理各种复杂问题, 列如: 时钟偏移, 解决数据冲突, 修复冲突, performance issues for highly contested keys, and latency issues associated with quorums.

基于Authoritative系统列如RethinkDB, MongoDB选择了维护数据一致性. 编写这类软件会容易的很多, 因为不需要处理与数据不一致的相关问题. 不过带来的缺点就是可用性会降低.

如果RethinkDB遇到了网络分裂并且从客户端的角度来看系统的行为取决于客户端在网络分裂的哪边.
如果客户端在副本票数较多的一侧那么系统可以继续运行不受影响. 如果在较少的一侧当客户端查询或更新记录时就会遇到错误不过当开发者标记了说使用out-of-date读取, 那么此时分片不会由经主副本确认, 这样也能继续保持运行, 不过获取到的数据是可能与网络分裂另一侧不符.

**RethinkDB内的集群配置如何在各节点之间传送?**

在分布式系统中更新集群状态是一个比较困难的任务, 可能会由于网络问题导致各信息到达各节点的时间有差异, 又有集群内节点配置可能存在冲突等问题.

RethinkDB在大多数情况下会使用Raft一致性协议来存储与分发集群配置.
特别情况下会使用带有内部时间戳的semilattices.
这种构架已经有数学证明可以解决上述所说的问题.

## 索引

**RethinkDB如何索引数据?**

用户创建表时可以选定一个字段作为主键(如歌用户没有选定则默认为`id`字段),
主键值会作为对于文档的索引. 主键值可以在插入记录时手动指定, 或者也可以为空让RethinkDB来自动生成.

每个记录的主键会被RethinkDB放置到对应的分片中, 同时使用B-Tree来对其进行检索.

**RethinkDB是否支持辅助索引与复合索引?**

RethinkDB是支持辅助索引与复合索引同时还提供了表达式索引供您使用.

## 可用性与容灾

**当服务器宕机时会发生什么?**

如果您的集群节点存在3台或以上时, RethinkDB将会自动执行故障转移以保证可用性.
* 如果表的主副本失效, 其余副本与分片副本的数量大于副本总数本数与分片副本总数则表受影响, 可以继续维持服务.
* 如果分片副本失效一半或更高那么表会进入失效状态, 您需要使用[reconfigure](https://www.rethinkdb.com/api/javascript/reconfigure)来对表进行命令__紧急修复__.

想了解更多信息, 请阅读[故障转移](/#/Docs/5-3)

**分片过程与副本复制过程性能与可用性影响**

大多数情况下当用户调整集群内的副本数量后副本复制的过程不会对系统可用性以及性能造成太大影响.

当用户调整分片数量后对分片的操作过程可能会对系统可用性造成一定影响, 目前我们正在尝试一些解决方案来规避这个问题.

## 执行细节

**RethinkDB是如何执行命令的?**

当在集群内的节点收到来自客户端的命令时, 它会评估命令然后按照以下步骤执行:

首先查询会被转换成内部可执行的操作. The operation stack fully describes the query in a data structure useful for efficient execution. The bottom-most node of the stack usually deals with data access— it can be a lookup of a single document, a short range scan bounded by an index, or even a full table scan. Nodes closer to the top usually perform transformations on the data – mapping the values, running reductions, grouping, etc. Nodes can be as simple as projections (i.e. returning a subset of the document), or as complex as entire stacks of stacks in case of subqueries.


Each node in the stack has a number of methods defined on it. The three most important methods define how to execute a subset of the query on each server in the cluster, how to combine the data from multiple servers into a unified resultset, and how to stream data to the nodes further up in small chunks.

As the client attempts to stream data from the server, these stacks are transported to every relevant server in the cluster, and each server begins evaluating the topmost node in the stack, in parallel with other servers. On each server, the topmost node in the stack grabs the first chunk of the data from the node below it, and applies its share of transformations to it. This process proceeds recursively until enough data is collected to send the first chunk to the client. The data from each server is combined into a single resultset, and forwarded to the client. This process continues as the client requests more data from the server.

The two most important aspects of the execution engine is that every query is completely parallelized across the cluster, and that queries are evaluated lazily. For instance, if the client requests only one document, RethinkDB will try to do just enough work to return this document, and will not process every shard in its entirety. This allows for large, complicated queries to execute in a very efficient way.

The full query execution process is fairly complex and nuanced. For example, some operations cannot be parallelized, some queries cannot be executed lazily (which has implications on runtime and RAM usage), and implementations of some operations could be significantly improved. We will be adding tools to help visualize and understand query execution in a user-friendly way, but at the moment the best way to learn more about it is to ask us or to look at the code.

**How does the atomicity model work?**

Write atomicity is supported on a per-document basis – updates to a single JSON document are guaranteed to be atomic. RethinkDB is different from other NoSQL systems in that atomic document updates aren’t limited to a small subset of possible operations – any combination of operations that can be performed on a single document is guaranteed to update the document atomically. For example, the user may wish to update the value of attribute A to a sum of the values of attributes B and C, increment the value of attribute D by a fixed number, and append an element to an array in attribute E. All of these operations can be applied to the document atomically in a single update operation.

However, RethinkDB does come with some restrictions regarding which operations can be performed atomically. Operations that cannot be proven deterministic cannot update the document in an atomic way. Currently, values obtained by executing JavaScript code, random values, and values obtained as a result of a subquery (e.g. incrementing the value of an attribute by the value of an attribute in a different document) cannot be performed atomically. If an update or replace query cannot be executed atomically, by default RethinkDB will throw an error. The user can choose to set the flag on the update operation in the client driver to execute the query in a non-atomic way. Note that non-atomic operations can only be detected when they involve functions (including row()) being passed to update or replace; a non-atomic insert operation will not throw an error.

In addition, like most NoSQL systems, RethinkDB does not support updating multiple documents atomically.

**How are concurrent queries handled?**

To efficiently perform concurrent query execution RethinkDB implements block-level multiversion concurrency control (MVCC). Whenever a write operation occurs while there is an ongoing read, RethinkDB takes a snapshot of the B-Tree for each relevant shard and temporarily maintains different versions of the blocks in order to execute read and write operations concurrently. From the perspective of the applications written on top of RethinkDB, the system is essentially lock-free— you can run an hour-long analytics query on a live system without blocking any real-time reads or writes.

RethinkDB does take exclusive block-level locks in case multiple writes are performed on documents that are close together in the B-Tree. If the contested block is cached in memory, these locks are extremely short-lived. If the blocks need to be loaded from disk, these locks take longer. Typically this does not present performance problems because the top levels of the B-Tree are all cached along with the frequently used blocks, so in most cases writes can be performed essentially lock-free.

## 数据存储 

**数据是如何存储的?**

RethinkDB中使用了特别的存储引擎. 其数据文件使用B树存储文件, 通过LFS来对数据文件进行写入.
这个存储引擎有一堆好处其中包括: 多线程垃圾回收, 较低的CPU占用, 对多核优化同时也正对了SSD进行优化, 
在服务器异常断电后依然能保证数据一致性并同时支持多版本并发控制技术(MVCC).

同时RethinkDB内部带有魔改版的B树来作为缓存配合存储引擎共同工作, 这可以让RethinkDB在仅有数十GB内存可用的情况下来操作高达T级别的数据.


**RethinkDB对数据鲁棒性如何?**

RethinkDB正对数据不会有任何校验操作, 数据完全依赖于文件系统.

**RethinkDB支持哪些文件系统?**

RethinkDB支持大多数文件系统. 同时也提供了direct I/O选项供您在有必要时开启.
