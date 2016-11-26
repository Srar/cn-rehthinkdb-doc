# 常见问题

## RethinkDB是什么?
RethinkDB是一款开源, 可扩展, 并具有实时性的JSON数据库.
其通过暴露一个令人兴奋的新访问模型来颠覆传统的数据库架构 - 开发人员可以告诉RethinkDB不断向应用程序实时推送更新的查询结果,
而不是轮询来获取结果.RethinkDB实时推送架构大大减少了构建可扩展实时应用程序所需的时间和精力.

除了为实时应用程序设计外, RethinkDB还提供灵活的查询语言, 直观的操作和监控API, 并且易于设置和学习.

有关RethinkDB更多技术细节请查看我们的博文[Advancing the realtime web](https://www.rethinkdb.com/blog/realtime-web/).

## 什么情景下使用RethinkDB是一个好选择?
当您的应用程序需要使用实时性数据并收益时(原文: RethinkDB is a great choice when your applications could benefit from realtime feeds to your data.), 那么RethinkDB就是一个好选择.

传统的数据库模型: 查询 -> 响应, 这在web应用上没问题, 因为http请求也是类似. 
然而现代应用需要将数据实时发送至客户端. 以下有一些使用场景受益于RethinkDB实时推送构架:

* 协同web应用和手机应用程序
* 流式分析应用
* 多人游戏
* 实时交易
* 物联网

有个更容易理解的例子: 当用户使用协同设计应用并修改其设计的按钮时, 服务器应当通知其他协同用户.
Web浏览器中可以使用WebSocket或者HTTP轮训方式来达成实时获取最新数据的效果, 但在数据库层让其适应实时应用的需求还是一个巨大的挑战.

RethinkDB是第一款专门用于将数据实时推送给应用程序并具有高扩展性的开源数据库. 它能够大大减少构建实时应用所话费的时间和精力.

## 谁的产品中使用了RethinkDB?
RethinkDB被数百个初创公司, 工作室, 以及500强在生产环境使用. 以下案例是其中的一些:

* [Jive Software](https://www.jivesoftware.com/)与[Mediafly](http://www.mediafly.com/)来RethinkDB驱动反应式web与手机应用.
* [Pristine.io](https://pristine.io/)与[Narrative Clip](http://getnarrative.com/)基于RethinkDB制作物联网设备的基础设施.
* [Platzi](https://platzi.com/)与[Workshape.io](https://www.workshape.io/)基于RethinkDB制作了实时分析应用.
* [CMUNE](http://www.cmune.com/)与[NodeCraft](https://nodecraft.com/)基于RethinkDB制作了一款高扩展性的多人游戏.

RethinkDB有一个充满活力的社区, 其中包括了来自世界各地的数百名贡献者, 以及十万开发者.

## RethinkDB是使用现有轮子造出来的吗?
为了实现高效的实时推送构架, 需要重新设计大多数现有的数据库组件, 其中包括查询引擎, 分布式系统, 缓存系统和存储引擎.
由于构架会影响数据库中的每个组件, 所以RethinkDB是从0开始编写. RethinkDB由数据库专家团队以及在世界数百位开发者的帮助下制作了5年的产品.

## RethinkDB与众多实时同步服务有何不同?
RethinkDB 在三个方面根本上不同于实时同步 Api 像[Firebase](https://www.firebase.com/), [PubNub](https://www.pubnub.com/) 或[Pusher](https://pusher.com/).

首先上述的实时同步API几乎都是云服务, 然而RethinkDB是一个开源项目.
RethinkDB可以在我们的合作伙伴平台上运行列如: [Compose.io](https://www.compose.io/) 与 [Amazon AWS](https://aws.amazon.com/marketplace/pp/B013R60Q8Y).
同样也能够运行在您自己的服务器上.

第二点, 实时同步API仅限于同步记录与限制更多的查询功能, 而RethinkDB是通用数据库.
您可以在RethinkDB中运行任意查询, 包括表连接, 子查询, 地理位置查询, 聚合操作以及map-reduce.

最后一点, 实时同步API设计为可以直接从浏览器访问, 这样可以让简单应用构建起来非常方便, 但是缺乏灵活性.
RethinkDB设计为从应用程序访问, 与访问传统数据库类似. 但这样初期可能需要比较多的代码, 但是随着应用程序复杂化其就能提供奇异般的灵活性.

## MongoDB与RethinkDB有何不同?
MongoDB构架与RethinkDB构架不同. 开发人员可以告诉RethinkDB让其不断推送更新的查询结果, 而不是轮训来查询.
您也可以使用传统的查询 -> 响应模式基于RethinkDB编写应用, 并在以后为您的应用添加实时功能提前铺好大道.

说明不如直接来代码, 如何在RethinkDB中查询一条记录:

```javascript
r.table('users').get('coffeemug').run()
```

如何订阅当记录更新时RethinkDB的事件流:

```javascript
r.table('users').get('coffeemug').changes().run()
```

RethinkDB的实时架构可以比作MongoDB的OPLOG，但提供了一个抽象更高接口.
RethinkDB的Feed与查询引擎无缝集成, 允许您在查询中订阅其他查询的查询结果, 而不仅仅像是OPLOG复制原始数据.

除了实时推送架构之外，RethinkDB还有很多地方优于MongoDB:

* 提供了一种高端查询语言, 支持表连接, 子查询和大规模并行分布式查询.
* 一个优雅而强大与查询语言集成的监控API, 使扩展RethinkDB工作量大大简化.
* 一个既低调又高端的Web管理界面, 点击几下就能完成分片和复制, 并且内置的Data Explorer提供了在线文档和查询建议, 

## 什么情景下使用RethinkDB是一个坏选择?
* 如果您需要完整的事物支持那么RethinkDB不是一个好选择, 您最好还是选择关系型数据库如: MySQL或PostgreSQL.
* 如您需要进行数据挖掘, 计算密集的分析. 您最好还是选择Hadoop或者Vertica.
* In some cases RethinkDB trades off write availability in favor of data consistency. If high write availability is critical and you don’t mind dealing with conflicts you may be better off with a Dynamo-style system like Riak.

<div class="infobox "><p><strong>想进一步了解RethinkDB?</strong></p>

    <ul>
        <li>阅读 <a href="/docs/2-0">10分钟快速了解</a> 来开始使用RethinkDB</li>
        <li>浏览 <a href="#">architecture overview</a> 来熟悉分布式系统</li>
        <li>跳转至 <a href="/docs/4-3">ReQL最佳实践</a>来看看RethinkDB中常见的查询例子</li>
    </ul>

</div>

# 实际问题

## 目前那些编程语言可以使用RethinkDB?

目前我们为Ruby, Python, Java与Javascript/Nodejs提供了官方库.
社区内开发者们为RethinkDB开发了多达十几种编程语言的第三方RethinkDB库, 其中包括.NET, Golang与PHP.

## changefeeds的扩展性如何?
changefeeds对于单个应用程序来说可以同时订阅多个feed, 
但目前web应用或者应用程序都会承载成千上万的并发连接, 所以RethinkDB设计的feed扩展性极高. 单个RethinkDB实例可以支撑数千的feed,
如您使用集群那么可以扩展到十万个feed.

## 那些系统上可以运行RethinkDB?
RethinkDB基于C++编写, 其可以运行在Linux的32与64位系统上, 或者macOS10.7+.
编程语言的RethinkDB库支持在任何系统上运行.

我们建议您运行RethinkDB至少有2GB的内存并没有其他硬件要求.
RethinkDB中有个可以自定义的缓存引擎, 这样就可以运行在小内存但是具有大量持久化数据的机器上了.
如果您有高端硬件列如固态硬盘, 高吞吐量网卡, RethinkDB也对其有专门支持.总体来说就是可长可短可硬可软.

## RethinkDB是否支持SQL?
然而并不支持, 不过RethinkDB内置的查询语言ReQL可以完成与SQL同样的任务. 其中包括表连接, 聚合操作. 并且其具有非常好的表达力以及非常容易学医.
ReQL还能够完成SQL完成不了的任务列如: 与Javascript混合查询, map-reduce等.

## RethinkDB是原子操作吗?
大多数涉及单个记录的写操作都是原子性的. 
具有不确定性的更新是无法以原子性进行操作的(列如子查询).
同时更新多条记录也不是原子性操作.

## 是否可以让RethinkDB访问[stale data](http://stackoverflow.com/questions/1563319/what-is-stale-state)?
当使用`table`命令选择表时候可以指定一个参数`read_mode`并将其设置为`single`(默认)这样读取出来的数据都不是stale data.
但是您可能会查询到还在内存中却还没有被写入硬盘的数据. 这相当于SQL的READ UNCOMMITTED隔离级别.
当`read_mode`设置为`outdated`时则可能会获取到stale data.

如果您的集群内发生了网络故障, 即使在`single`模式, 您可能读取到stale data. 因为网络导致一边的节点无法受到另一边节点的新数据.
如果您想完全避免读取stale data情况发生, 您可以将`read_mode`设置为`majority`, 不过`majority`的读取速度会比较慢.
有关更多信息请阅读[Consistency guarantees](#)文档.

## 如何在RethinkDB集群中寻找查询分发器并执行查询?
开发者不需要关心这个问题, 您只需要连接到集群内任意一个节点并执行查询即可. 
RethinkDB集群内部会将查询自动发送至对应的节点, 其中高级查询列如`join`或者`filter`会被自动并行执行,自动合并结果返回.
这一切都不需要你关心.

## RethinkDB写持久化模式是如何的?
默认情况下RethinkDB与传统数据库处理的方式相同, 只会在数据写入硬盘后才会报告插入成功.

> 想提高查询性能? 请阅读[异常恢复](/docs/7-1)中的 "插入速度很慢, 如何提高插入记录速度?"

## RethinkDB会自动提交那些统计数据?
默认情况下RethinkDB会在检测版本的时候将匿名统计信息发送给RethinkDB HQ, 其报告的信息包括:
* RethinkDB版本
* 集群内节点数量
* 操作系统与32位或64位
* 2round(log2(表的数量)

您可以在启动参数内添加`no-update-check`, 这样就不会发送统计信息了.

## RethinkDB的开源许可是什么?
RethinkDB数据库采用[GNU Affero General Public License v3.0](http://www.gnu.org/licenses/agpl-3.0.html).
RethinkDB的各语言库采用[Apache License v2.0](http://www.apache.org/licenses/LICENSE-2.0.html).

