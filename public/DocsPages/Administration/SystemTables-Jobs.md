# 系统表 - jobs
`jobs`表RethinkDB 1.16中添加的系统表之一.
它提供有关在RethinkDB群集中运行的任务信息, 包括查询, 数据压缩和创建索引, 并允许您通过从表中删除任务来终止任务.

# 查询jobs表
> 与其他系统表一样, `jobs`表只能由`admin`帐户访问.

表中的主键是`id`字段，且其是一个数组. 第一个数组元素是任务的字符串类型(列如`query`, `disk_compaction`).
第二个元素是任务的UUID. 任务类型也同时会在`type`字段标出.

```javascript
// 获取全部正在执行的任务
r.db("rethinkdb").table("jobs").run(conn, callback);

// 获取全部正在查询的任务
r.db("rethinkdb").table("jobs").filter({type: 'query'}).run(conn, callback);

// 删除指定的查询任务
r.db("rethinkdb").table("jobs").get(
    ["query", "72789a11-b2e1-4b45-a3ab-af996dcaf484"]
).delete().run(conn, callback);
```

# 结构概要
任务类型共有4种. 4种任务类型记录结构都是一样的, `info`字段内会标识任务特定信息.

```json
{
    "duration_sec": <number> or null,
    "id": [ <type string>, <uuid> ],
    "info": { <metadata },
    "servers": [ "server1", "server2", ... ],
    "type": <type string>
}
```

## query
由那个客户端发出的查询请求:

```json
info: {
    "client_address": <IP address string>,
    "client_port": <number>
}
```

## disk_compaction
有哪些实例正在执行数据压缩压缩任务, `disk_compaction`不包含特定任务信息.
```json
info: { }
```

## index_construction

该任务标示了有那些索引创建任务.`progress`字段为0~1之间的值，乘以100就是创建索引进度的百分比.

```json
info: {
    "db": <database name>,
    "index": <index name>,
    "progress": <number>,
    "table": <table name>
}
```
## backfill
回填任务表示集群之间正在传送最新分片数据. `progress`字段为0~1之间的值，乘以100就是回填进度的百分比.

```json
info: {
    "db": <database name>,
    "destination server": <server being copied to>,
    "source_server": <server being copied from>,
    "table": <table name>,
    "progress": <number>
}
```
