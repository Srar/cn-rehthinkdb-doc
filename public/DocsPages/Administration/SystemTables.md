# 系统表
从RethinkDB 1.16开始，RethinkDB内就有个特殊的系统表, 系统表包含有关服务器，数据库，状态信息,单个表的配置, 以及集群问题.
查询系统表返回有关集群和集群中当前对象（例如服务器和表）状态的信息.
通过插入或删除这些表中的记录和更新字段，可以修改它们表示的对象的配置。

## 概要
您需要通过`rethinkdb`数据库来访问系统表, 上述说特殊的系统表是因为其表内存储的记录不是以真正的RethinkDB记录一样存储.
是映射至系统内, 并且提供了接口以供ReQL命令控制. 系统表不能创建, 删除, 配置或重命名.

系统表中的元数据适用于整个RethinkDB群集. 
集群中的每个实例都维护其自己的系统表副本. 每当实例上的系统表发生更改时, 所有实例上都会同步更改.

> 从2.3版本开始只有`admin`用户可以访问系统表. 您可以阅读[用户帐号与用户权限](/docs/5-2)来了解详细

## 系统表列表
* `table_config`: 存储了表的配置包括分片与副本. 当您修改`table_config`内记录时您相当于操作了 创建, 删除, 或者配置表.
* `server_config`: 存储了实例名与实例标签, 当修改此表时您可以重命名实例名与重新标记标签.
* `db_config`: 存储了数据库的UUID以及名称, 当修改此表时可以创建, 删除或修改数据库.
* `cluster_config`: 存储了集群authentication key.
* `table_status`: 只读表, 它能够返回系统中表状态与配置.
* `server_status`: 只读表, 它能够返回有关每个服务器的进程和主机信息.
* `current_issues`: 只读表, 它会返回目前集群内出现的问题, 如想了解详细请阅读[System current issues table](/docs/5-6)
* `users`: 存储了RethinkDB用户帐号信息 [用户帐号与用户权限](/docs/5-2)
* `permissions`: 存储了RethinkDB用户权限与权限范围信息 [用户帐号与用户权限](/docs/5-2)
* `jobs`: 列出了目前正在执行的任务, 列如查询, 创建索引, 磁盘压缩, 以及其他耗费时间的任务. 并允许您中断任务.
* `stats`: 只读表, 它能够返回集群统计信息.
* `logs`: 只读表, 用于存储集群中所有实例的日志消息.

__附加说明__

* 系统表支持changefeeds, 但是不支持链式调用调用. 列如聚合操作`max`, `min`与`limit`命令 这些是无法在系统表使用的.
* 部分系统表只有只读. 允许写入的系统表执行写入操作的时候需要遵守特定的格式. 下面会写
* 对系统表执行写入操作是非原子性操作, 请避免多个客户端同时操作系统表.
* 系统表会无视`durability`参数

当使用系统表时候, `table`命令将会有个新参数`identifier_format`. `identifier_format`值可以是`name`(默认)或者`uuid`.
当设置为`uuid`时, 系统表中对数据库或其他表的引用将是UUID而不是数据库名/表名. 
这会有利于编写管理脚本. 因为即使对象名称被修改, UUID也不会发生变化.

## 配置系统表
---
## server_config
分片与副本功能以及更高级的功能写入确认与写入持久化都可以用过`table_config`来控制. 并可以通过修改表记录来重命名表. `table_config`中的记录看起来会是这样:

```
{
    id: "31c92680-f70c-4a4b-a49e-b238eb12c023",
    name: "tablename",
    db: "test",
    primary_key: "id",
    shards: [
        {
            primary_replica: "a",
            "replicas": ["a", "b"],
            "nonvoting_replicas": []
        },
        {
            primary_replica: "b",
            "replicas": ["a", "b"]
            "nonvoting_replicas": []
        }
    ],
    indexes: ["index1", "index2"],
    write_acks: "majority",
    durability: "hard"
}
```

* `id`: 只读 表UUID.
* `name`: 表名.
* `db`: 所归属的数据库，值是UUID或者数据库名.
* `primary_key`: 只读 表主键字段 只有表创建时候才能够调整.
* `shards`: 表的每个分片列表, 列表内对象会有以下字段:
    * `primary_replica`: 主分片所在的实例显示为UUID或者实例名称. 如果`primary_replica`为`null`那么说明这个表不可用. This may happen if the server acting as the shard’s primary is deleted.
    * `replicas`: 实例列表, 包含了主分片, 存储分片的副本
    * `nonvoting_replicas`: 在自动故障转移中没有参与报告的实例, 如果这个字段不存在那么说明为空表. 此列表内必须是其他子副本, 不能为主副本.
    * `indexes`: 只读 表的全部索引
    * `write_acks`: 其有两个值`majority`(默认)与`single`. 使用`majority`:当大多数表副本已经确认数据已写入那么集群会返回记录插入成功. 使用`single`:当一个表副本确认数据已经写入那么集群会返回记录插入成功
    * `durability`: 其有两个值`hard`(默认)与`soft`. 使用`hard`当成功写入硬盘后才会报告已成功写入. 使用`soft`当接受到数据时候就报告成功写入.

如果您删除了`table_config`中的记录那么您删除的那条记录所对应的表也会被删除.
如果您插入记录仅需要填写`name`与`db`字段，其他字段为可选自动系统将会帮您自动填写默认值, 但是请不要填写`id`字段, 其会由系统自动生成uuid.

如果您使用了您在`table_config`中使用了`replace`, 则必须包括所有字段. 通常使用`update`特定字段更容易.

使用ReQL命令同样可以控制分片或者副本列如`reconfigure`, 如果您没有使用实例标签那么您可以用过Web管理界面来控制分片或者副本.
阅读[标记, 分片, 副本](/docs/5-1)来了解更多

## db_config
对于集群中的每个数据库, `db_config`中都存在一个记录, 记录中只有两个字段.

```
{
    id: "de8b75d1-3184-48f0-b1ef-99a9c04e2be5",
    name: "dbname"
}

```
* `id`: 只读 数据库的uuid
* `name`: 数据库的名称

可以通过插入记录来新建数据库, 删除记录来删除数据库, 和更新来重命名数据库
(只有重命名数据库需要直接查询`db_config`表, 
新增和删除可以通过ReQL命令来使用[dbCreate](https://www.rethinkdb.com/api/javascript/db_create), [dbDrop](https://www.rethinkdb.com/api/javascript/db_drop))
请不要包含`id`字段, 其会由系统自动生成uuid.

## cluster_config
`cluster_config`表中只有一条记录, 该表无法插入或者删除记录.
```
{
    id: "heartbeat",
    heartbeat_timeout_secs: 10
}
```
* `id`: 主键 `heartbeat`.
* `heartbeat_timeout_secs`: 当集群中实例离线超过多少秒后触发自动故障转移. 默认为10秒.

## 状态表
全部的状态表都是只读的. 配置表中的一些字段会同时出现状态表中.

## table_status
这个表会存储表的可用信息, 每个表都会有一个记录(不包括系统表).
```
{
    id: "31c92680-f70c-4a4b-a49e-b238eb12c023",
    name: "tablename",
    db: "test",
    status: {
        ready_for_outdated_reads: true,
        ready_for_reads: true,
        ready_for_writes: true,
        all_replicas_ready: true
    },
    shards: [
        {
            primary_replicas: ["a"],
            replicas: [{server: "a", state: "ready"}, {server: "b", state: "ready"}]
        },
        {
            primary_replicas: ["b"],
            replicas: [{server: "a", state: "ready"}, {server: "b", state: "ready"}]
        }]
}
```

* `id`: 只读 表UUID.
* `name`: 表名.
* `db`: 所归属的数据库，值是UUID或者数据库名.
* `status`: 该字段对象表示了表全部表分片是否已经做好接受特定查询的准备: `outdated_reads`, `reads`与`writes`. `all_replicas_ready`字段表示了副本是否都已经复制完毕.
* `shards`: 表的每个分片列表, 列表内对象会有以下字段:
    * `primary_replica`: 这个列表表示零个或者多个分片的主副本, 如果其列表内超过1个实例说明这个分片在被多个实例使用着, 一般这种情况不会持续很久.
    * `replicas`: 这个列表表示了全部分片的副本所在实例. 列表其中可能包含了还未处理完表复制任务的实例, 等待处理完毕实例就会从列表内消失(翻译不准确 请看原文).
    列表其中还有一个`state`字段，其会值会为以下其中一个:
        * `ready`: 分片所在实例已经做好查询准备.
        * `transitioning`: 实例在上述状态中, 一般transitioning状态只会持续一会.
        * `backfilling`: 实例正在从集群中别的实例获取数据. 
        * `disconnected`: 实例未连接到集群.
        * `waiting_for_primary`: 实例正在等待主副本可用.
        * `waiting_for_quorum`: 主实例在开始接受写操作之前, 正在等待表的副本quorum投票.

## server_status
此表存放有关RethinkDB群集中的实例, 进程状态, 连接信息, 与可用性记录. 集群中的每个实例都会在表中有一条记录. 如果实例从集群内断开, 那么那个实例的记录会从`server_status`表中删除.

```json
{
    id: "de8b75d1-3184-48f0-b1ef-99a9c04e2be5",
    name: "servername",
    network: {
        hostname: "companion-cube",
        cluster_port: 29015,
        http_admin_port: 8080,
        reql_port: 28015,
        time_connected: <ReQL time object>,
        connected_to: {
            "companion-orb": true,
            "companion-dodecahedron": true
        },
        canonical_addresses: [
            { host: "127.0.0.1", port: 29015 },
            { host: "::1", port: 29015 }
            ]
    },
    process: {
        argv: ["/usr/bin/rethinkdb"],
        cache_size_mb: 100,
        pid: 28580,
        time_started: <ReQL time object>,
        version: "rethinkdb 2.2.5 (CLANG 7.0.2 (clang-700.1.81))"
    }
}
```

* `id`: 实例UUID.
* `name`: 实例名称.
* `network`: 实例网络信息:
    * `hostname`: 通过`gethostname()`获取的主机名.
    * `*_port`: RethinkDB监听的端口.
    * `canonical_addresses`: 全部可用连接至RethinkDB的IP列表.
    * `time_connected`: 啥时候连接或者与集群断开的.
    * `connected_to`: key/value已连接的实例列表; key代表已经连接过的实例名当无法查询实例名时会以UUID标识. value代表实例是否已经连接上.
* `process`: 实例进程信息:
    * `argv`: 启动实例时候指定的参数.
    * `cache_size_mb`: 内存缓存大小.
    * `pid`: 进程pid.
    * `time_started`: 实例已经运行多久了.
    * `version`: 实例RethinkDB版本.

## 用户账户表
有关这两个表的详细信息，请阅读[用户帐号与用户权限](/docs/5-2).

## users
`users`表中的每条记录都代表着系统中的每个用户, 表中结构为每条记录由2个key/value组成. 一条记录仅有`id`和`password`字段.
`id`代表用户账户名. `password`代表了这个用户是否设置了密码; 您可以通过更新`password`字段来达到修改用户密码的目的, 如果需要删除密码则将`password`更新为`false`即可.
需要了解的是密码只能写不能读, 您只能通过`password`返回的`true`和`false`来知道是否设置了密码.

```json
{
    id: "admin",
    password: true
}
```
可以通过插入记录至`users`表来新建用户, 也可以通过删除记录来删除用户. 您不能更新已经创建好的`id`修改, 您只能更新或者删除密码.

## permissions
`permissions`表中的记录有2~4个key/value组成.
* `id`: 其是一个数组表示了用户与权限，权限范围. 第一个元素为用户名，第二个数据库UUID(数据库范围权限)，第三个表UUID(表范围权限)
* `permissions`: 其是一个对象存储了1~4个值为bool的权限信息, 权限包括: `read`, `write`, `connect`, `config`.
* `database`: 权限所对应的数据库名称, 只存在于具有数据库或表范围的权限.
* `table`: 权限对应的表名称, 只存在于具有表范围的权限.

```json
{
    id: [
            "bob"
        ],
    permissions: {
        read: true,
        write: false,
        config: false
    }
}
{
    database: "field_notes",
    id: [
            "bob",
            "8b2c3f00-f312-4524-847a-25c79e1a22d4"
        ],
    permissions: {
        write: true
    }
}
{
    database: "field_notes",
    table: "calendar",
    id: [
            "bob",
            "8b2c3f00-f312-4524-847a-25c79e1a22d4",
            "9d705e8c-4e49-4648-b4a9-4ad82ebba635"
        ],
    permissions: {
        write: false
    }
}
```

> 当您通过插入记录时您只需要关注`permissions`字段与`id`字段, `table`与`database`字段系统会根据`id`字段数组自动填写.

正常情况下建议您使用更简单的[grant](https://www.rethinkdb.com/api/javascript/grant)命令来管理权限.

## 其他表

## current_issues

此表显示在RethinkDB群集中检测到的问题. 有关详细信息, 请阅读[System current issues table](#).

## jobs

`jobs`表提供有关在RethinkDB群集中运行的任务的信息, 包括查询, 磁盘压缩和索引创建, 并允许您通过从表中删除查询任务来终止任务. 
有关详细信息, 请阅读[System jobs table](#).

## stats
`stats`表提供有关服务器读/写吞吐量, 客户端连接和内存使用情况的统计信息. 有关详细信息, 请阅读[System stats table](#).

## logs
此表存储集群的日志文件. 对于连接到集群的每个实例生成的日志消息, 将向表中添加一行. 每个实例最多可存储1000行日志. 

```json
{
    id: ["2015-01-09T02:11:55.190829899", "5a59c88f-8f66-4703-bf74-bf4cd7205db3"]
    level: "notice",
    message: "Running on Linux 3.13.0-24-generic x86_64",
    server: "companion_cube_3yz",
    timestamp: <ReQL time obj>,
    uptime: 0.389226
}
```
* `id`: 包含两个元素的数组. 第一个为发生的UTC时间, 第二个为那个实例生成的日志.
* `level`: 日志严重等级: `debug`, `info`, `notice`, `warn`, 或者 `error`.
* `server`: 生成日志实例的uuid或者实例名 这取决于`identifier_format`参数.
* `timestamp`: 发送日志的时间.
* `uptime`: 生成日志实例已经运行的时间.

`logs`表支持changefeeds来订阅日志事件. 只有插入日志时候才会触发事件.
* 每个实例最多会存储1000行日志, 当超过1000行时自动删除的日志不会触发changefeeds.
* 当实例与集群连接或断开时，其也不会触发changefeeds.
