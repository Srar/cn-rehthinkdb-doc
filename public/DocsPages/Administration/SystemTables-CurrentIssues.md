# System current issues table
`current issues`表RethinkDB 1.16中添加的[系统表](/docs/5-5)之一.
这个表是只读的. 当集群内无问题时此表为空.

当查询这个表时候如果没有使用`filters`, 那么会返回全部问题记录.

> 与其他系统表一样, `current_issues`表只能由`admin`帐户访问.

```javascript
r.db("rethinkdb").table("current_issues").run(conn, callback);
```

表内记录会以以下结构返回

```json
{
    id: "<uuid>",
    type: "<type>",
    critical: <bool>,
    info: {
        <type-specific fields>
    },
    description: "<type-specific string>"
}
```
* `id`: 主键，当这个问题在没有修复前都不会有变化.
* `type`: 问题概要(文档下面会讲).
* `critical`: 当为`true`时就失去了可用性.
* `info`: 问题细节. key/value将取决于问题类型.
* `description`: 已人类语言来描述这个问题, 并且提供解决方法.

您可以通过`type`字段来查询特定类型问题:

```javascript
r.db("rethinkdb").table("current_issues").filter({type: "outdated_index"}).run(conn, callback);
```

# 问题类型

> 如果您为`table`指定了`identifier_format`参数为`uuid`, 那么问题内的实例, 数据库, 表都会以uuid来表示而不是名字.

## Log write issues

```
type: "log_write_error"
critical: false
info: {
    servers: ["server_a", "server_b", ...],
    message: "<error message>"
}
```

RethinkDB无法将日志写入日志文件(或者通过管道`stdout/stderr`).
`message`是RethinkDB从系统接受到的写入错误信息. `server`是受影响的实例.

请查找并解决实例无法写入日志问题(可能是硬盘满了). 如有多个相同的错误类型, 那么表内只会出现一个问题.


## Name collision issues
```
type: "server_name_collision" | "db_name_collision" | "table_name_collision"
critical: true
info: {
    name: "<name in conflict>",
    ids: ["<uuid1>", "<uuid2>", ...],
    db: "<name>"
}
```
如果问题类型为`table_name_collision`才会有`db`字段

集群内实例之间，数据库之间，表之间指定了相同的名称.
`name`字段表示了冲突的名称, `ids`数组字段表示了互相冲突的对象uuid.
如果问题类型为`table_name_collision`那么`db`字段会表示该冲突发生在那个数据库中.

正常情况下系统会阻止创建或修改成有冲突名称的查询. 但是系统表是非原子性操作的, 两个客户端可能在不同的实例操作集群
然后同时建立了拥有相同名称的表或数据库. 当发生冲突时候系统将无法从冲突中的数据库或者表中读取或写入数据.


## Outdated index issues

```json
type: "outdated_index"
critical: false
info: {
    tables: [
        {
            table: "foo",
            db: "bar",
            indexes: ["ix1", "ix2", ...]
        }
    ]
}
```
当使用旧版本的RethinkDB构建的索引时，索引需要重建，因为ReQL处理索引的方式发生了变化.
阅读[My secondary index is outdated](#)来了解如何重建索引.

`info`字段内会说明那些表的索引需要重建.

## Table availability issues

```json
type: "table_availability"
critical: true | false
info: {
    table: "foo",
    db: "bar",
    shards: [
        {
            primary_replicas: ["replica1"],
            replicas: [
                { server: "replica1", state: "ready" },
                { server: "replica2", state: "disconnected" }
            ]
        }
    ],
    status: {
        all_replicas_ready: false,
        ready_for_writes: false,
        ready_for_reads: true,
        ready_for_outdated_reads: true
    }
}
```
当集群内表副本开始缺少时会触发这个问题类型. `description`字段会报告那个实例那个表出现问题.
当`critical`为`true`时说明这个表已经无法使用，您将无法对这个表读取或者写入记录.
如果`critical`为`false`说明表依然可用.

当表不可用时，但全部实例正常的时候，不会触发`table_availability`问题类型.(列如当配置分片与分片副本时可能会短暂出现表不可用)

对于每个表触发这个问题类型最多会触发一次.

## Memory availability issues
```json
type: "memory_error"
critical: false
info: {
    servers: [ "server1" ],
    message: "Data from a process on this server has been placed into swap memory in the past hour. If the data is from RethinkDB, this may impact performance."
}
```
这个消息代表RethinkDB已经开始使用swap内存了.
在Linux下, 仅当RethinkDB进程已经开始swap内存时, 才会出现此消息;
在macOS下, 任何任何进程开始使用swap内存时都会出现消息;
Windows版本下RethinkDB无法检测是否已经使用分页内存.

当RethinkDB开始使用swap内存时, 会导致RethinkDB性能下降. 使用的swap内存越多性能下降的越多.
您可能需要在服务器上关闭一些不使用的进程, 调整swap内存大小, 或调整内核`swappiness`参数([Troubleshooting](#)来了解详细). 或者来个更直接的给服务器加内存.

## Connectivity issues
```
type: "non_transitive_error"
critical: false
info: {
    servers: [ "server1", "server2" ],
    message: "Server connectivity is non-transitive."
}
```
这个消息说明目前查询实例无法与集群内多个实例通讯. 这有可能会导致表不可用. 它可以通过恢复完全连接来解决(原文:It can be resolved by restoring full connectivity).

此问题最多对每个实例出现一次.