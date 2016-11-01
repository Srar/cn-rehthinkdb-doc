# RethinkDB中的Map-reduce
[Map-reduce](https://zh.wikipedia.org/wiki/MapReduce)是一种以高效的方式对可能存储在许多服务器上的大型数据集汇总和运行聚合函数的方法。
 它通过并行处理每个服务器上的数据, 然后将这些结果合并成一个集合来工作。 
 它最初由Google设计, 后来在数据库系统如[Hadoop](http://hadoop.apache.org/)和[MongoDB](http://www.mongodb.org/)中实现。

 <p>
    <img src="/DocsPages/images/map-reduce.png" class="api_command_illustration">
</p>