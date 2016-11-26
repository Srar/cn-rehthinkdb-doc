# RethinkDB 2.1.5 性能与扩展性报告
这篇报告描述了最近一项努力: RethinkDB团队测量了RethinkDB在压测负载与不同集群下的性能指标.
我们致力于提供各种压测下与潜在使用案例下的RethinkDB性能指标. 在报告中我们将讨论以下问题:
* 使用集群后有多大的性能提升?
* RethinkDB的扩展性有多好?
* Can I trade consistency for performance?

测试使用YCSB, YCSB全称为Yahoo! Cloud Serving Benchmark, 是雅虎开源的一款通用的性能测试框架。YCSB不仅安转简单, 还可以自由扩展测试数据类型和支持的数据库产品.
通过对其进行扩展, YCSB可以支持对多个不同的NOSQL产品进行性能测试, 通过测试结果可以了解数据库在并发写入、读取、更新时的一些指标, 比如吞吐量、操作延迟等.
然后我们选择了扩展YCSB创建了一个额外测试来分析工作负载的可扩展性.

在以下测试结果中您将会看到RethinkDB如何扩展至每秒响应130万次纯查询请求, 还将演示如何在混合5:5读写中每秒响应10万次查询并同时保证数据数据完整性.
我们从1个节点扩展至16个节点每次扩展都会做一次基准测试.

> 注意: 以下测试结果是基于RethinkDB 2.1.5. 为了覆盖各项性能报告需要大量的工作. 我们会在将来更新后续的RethinkDB版本性能报告.

# 快速预览性能报告
当使用两台服务器进行混合读写时每秒能响应16K QPS, 当扩展至十六台服务器时QPS能达到120K QPS.
在只读同步查询查询中单台服务器每秒能响应150K QPS, 使用十六台服务器时会超过550K QPS.
同样是只读测试同步更变为了异步并设置了outdated read会从单台服务器150K至十六台服务器1.3M QPS.

最后我们使用MapReduce来查询整个数据集中的字符数. 这个测试以一种简单但是不常见的方式来评估RethinkDB的性能以及扩展性.
这些类型的工作负载涉及在服务器本身上进行信息处理, 而不是对在应用层处理的信息的典型的单一或有范围的读取和写入.

以下展示了从1扩展到16个节点的性能散点图:

![w-a](/DocsPages/images/w-a.png)
![w-c-sync](/DocsPages/images/w-c-sync.png)

![w-c-async](/DocsPages/images/w-c-async.png)
![analytical](/DocsPages/images/analytical.png)

# 压测方式与硬件
YCSB默认自带各种压测方式, 但是为了测试目的我们选择了其中两个来对RethinkDB进行压测.
其中我们选择了50%读与50%更新的压测A, 与纯查询的C模式. YCSB测试文档包含10个字段, 每个字段随机100个字节作为值, 每个记录大约为1kb.

YCSB连接RethinkDB是基于我们官方的RethinkDB库来连接的. 并打算在将来提交一个pull request. 目前您可以点[这里](https://github.com/rethinkdb/ycsb)来查看源码.

由于RethinkDB扩展起来异常方便, 所以我们认为有必要从单个实例依次测试到更大的集群以便观察性能变化.

## 硬件
硬件方面我们使用[rackspace OnMetal](https://www.rackspace.com/en-us)服务器来运行RethinkDB实例与RethinkDB的压测客户端.
以下是RethinkDB实例与RethinkDB压测客户端的配置信息

<table>
  <thead>
    <tr>
      <th>1-16 RethinkDB servers</th>
      <th>8 RethinkDB clients</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Rackspace OnMetal I/O</td>
      <td>Rackspace OnMetal Compute</td>
    </tr>
    <tr>
      <td>2x Intel Xeon E5-2680 v2 CPU 2.8 GHz (2x10 cores)</td>
      <td>Intel Xeon E5-2680 v2 CPU 2.8 GHz (10 cores)</td>
    </tr>
    <tr>
      <td>128 GB 内存</td>
      <td>32 GB 内存</td>
    </tr>
    <tr>
      <td>10Gbps 网卡</td>
      <td>10Gbps 网卡</td>
    </tr>
    <tr>
      <td>Seagate Nytro WarpDrive BLP4-1600 storage</td>
      <td>&nbsp;</td>
    </tr>
  </tbody>
</table>

## 配置
测试期间我们使用了以下产品/配置完成了测试:
* RethinkDB version 2.1.5
* Ubuntu 14.04
* RethinkDB缓存为64G其他为默认设置
* Oracle Java 1.8.0 
* [RethinkDB port of YCSB](https://github.com/rethinkdb/YCSB/tree/a15e249d6b10147e615ddfaf03672bad35e85e7f)

# 压测详细

## 压测A
* 模拟5:5的读写
* 50%是单个记录读取, 50%是单个记录更新
* 已[Zipfian](https://en.wikipedia.org/wiki/Zipf%27s_law)分布来选择操作记录
* 对于每个实例每个客户端会使用128个连接
* 数据副本存在与两个实例, 数据分片存在与全部实例上
* 写模式为`hard`(等待两个副本成功写入硬盘后再确认写入成功)
* 总共执行5000万次操作

通过YCSB生成了25万条记录, 每个记录大小为1KB. 在这种情况下，所有数据都适合使用缓存。

读写操作分别由8个客户端来操作, 并且每个实例会有128个并发连接. 这意味着当使用16个实例集群会有2048个并发连接.
同时我们使用了表副本, 其会把每条记录保存至两个不同的实例上.

当使用两个RethinkDB实例作为集群压测时其QPS到达了14.6K, 在后续添加实例进集群后性能几乎成线性增长:

![w-a](/DocsPages/images/w-a.png)

延迟也是衡量测试性能的重要指标. 在16个实例集群中, 第[95个百分位](https://www.zhihu.com/question/20575291)为26ms.

![w-a-reads-latency](/DocsPages/images/w-a-reads-latency.png)

## 压测C
* 只读查询
* 查询单个记录
* 已[Zipfian](https://en.wikipedia.org/wiki/Zipf%27s_law)分布来选择操作记录
* 对于每个实例每个客户端会使用128个连接
* 数据副本存在与两个实例, 数据分片存在与全部实例上
* `synchronous`测试使用默认模式: `{readMode: ”single”}`
* `asynchronous`测试使用`{readMode: ”outdated”}`模式
* 总共执行2亿次操作

这个压测专门执行读取操作以从数据库中查询单个记录, 其数据集采用的和压测A数据集为同一个, 读取也是使用8个客户端,
对于每个实例客户端会对其开启128个并发连接.

我们首先使用RethinkDB默认配置进行压测, 禁止stale reads.
在默认配置中RethinkDB单机能达到134.7K QPS, 当使用集群后由于具有网络开销所以QPS略有下降,
但进一步向集群内添加实例就能看到RethinkDB QPS又是以线性增长. 当集群内有16个实例时QPS达到了550K+.

![w-c-sync](/DocsPages/images/w-c-sync.png)

我们还扩展测试了outdated read模式下的伸缩性, 在这种模式下我们可能会读取到过时的数据, 但是有额外的性能提升.
因为读取操作可以由副本直接返回而不需要询问别的节点数据是否有更新, 这种访问模式可以被作为具有持久化的高速缓存.

![w-c-async](/DocsPages/images/w-c-async.png)

RethinkDB在这项测试中表现出了极高的可伸缩性, 其每秒响应数量超过一百万个, 当从12个实例扩展到16个实例是性能成亚线性增长, 是因为测试客户端的CPU满了.

在延迟方面第95个百分位为3ms, 即使在大量查询请求的情况下大多数的响应速度还是保持为0ms~1ms之间, 这可以从下面的图看出来:

![w-c-reads-latency](/DocsPages/images/w-c-reads-latency.png)

## 数据分析

* 测试响应时间包括MapReduce查询与字符串操作
* 查询类型：计算单个字段上的句子总数：`table.map(r.row(“field0”).split(“.”).count()).sum()`
* 每次会运行一个查询, 并且会执行相同的测试5次来获取响应时间平均值

最后我们将展示RethinkDB会自动将查询并行化, 查询会自动以MapReduce分布在集群内的各实例上.

在此示例中，我们挑选了一个字段, 并基于字段计算整个数据集的句子数量.
其ReQL语句使用了map与sum(reduce):

```javascript
table.map( r.row("field0").split(".").count() ).sum()
```

我们会正对一次测试重复运行5次, 以便获取平均值.

<table>
  <thead>
    <tr>
      <th>Nodes</th>
      <th>1</th>
      <th>2</th>
      <th>3</th>
      <th>4</th>
      <th>8</th>
      <th>12</th>
      <th>16</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>耗时</td>
      <td>59s</td>
      <td>32s</td>
      <td>23s</td>
      <td>15s</td>
      <td>9.6s</td>
      <td>7.4s</td>
      <td>4.4s</td>
    </tr>
  </tbody>
</table>

当使用单个实例时完成查询需要59秒, 运行相同的查询在16个实例上时仅需要4秒就能完成查询, 这也展示了RethinkDB实际上线可伸缩性.
以下图表展示了每秒能够完成查询的数量:

![analytical](/DocsPages/images/analytical.png)

# 结论
我们希望提供一个覆盖各种不同负载下RethinkDB的全面测试.
We chose to use the YCSB testing framework as a reliable and community-approved means of conducting rigorous testing on our database. We saw that all of the tests resulted in near-linear scalability as we moved from a single RethinkDB instance to a 16 node cluster. Although most of the tests resulted in performance metrics that suggest horizontal scalability, we know that there are plenty of improvements to make as the database evolves.

# Ongoing
Near to the release of this performance report, we are excited to release RethinkDB 2.3 with plenty of new features. Rigorous performance testing, and properly publishing results is a very time-consuming process, but one we will conduct for future releases on an ongoing basis. We plan to publish our next set of metrics during the lifetime of the RethinkDB 2.3 release. We also would like to test RethinkDB performance when scaled to beyond a 16 node cluster during our next testing cycle. Going forward, we will include a summary of previous reports at the end of each report for comparison.

## Notes

* We were fortunate enough to receive free credits from Rackspace to perform the majority of these tests and are very grateful for their contributions to open source software. All of [Rackspace’s OnMetal offerings can be found here](https://www.rackspace.com/cloud/servers/onmetal).
* We’d love to answer any questions you have about these tests. Come join us at [http://slack.rethinkdb.com](http://slack.rethinkdb.com) and feel free to ask more specific questions we don’t answer here by pinging @danielmewes or @dalanmiller.
* Recently, the team behind BigchainDB – a scalable blockchain database built on top of RethinkDB – has benchmarked RethinkDB on a 32-server cluster running on Amazon's EC2. They measured throughput of more than a million writes per second. Their conclusion: "There is linear scaling in write performance with the number of nodes." The full report is available at [https://www.bigchaindb.com/whitepaper/](https://www.bigchaindb.com/whitepaper/)
* We also recently contracted Kyle Kingsbury, known to the Internet as [@aphyr](https://twitter.com/aphyr), as an independent researcher to evaluate RethinkDB. He wrote [a pair of blog posts](https://aphyr.com/tags/RethinkDB) on how he tested and confirmed RethinkDB clustering and consistency guarantees.
