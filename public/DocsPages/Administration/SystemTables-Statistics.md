# 系统表 - statistics
`stats`表RethinkDB 1.16中添加的系统表之一.
它提供有关实例读/写吞吐量, 客户端连接和内存使用情况的统计信息.

# 查询stats表
> 与其他系统表一样, `stats`表只能由`admin`帐户访问.

```javascript
r.db("rethinkdb").table("current_issues").run(conn, callback);
```

表中的主键是`id`字段，且其是一个数组. 第一个数组元素总是对象的字符串描述(列如`table`, `server`).
除了`cluster`其他对象都有第二个元素，第二个元素是对象的UUID.

```javascript
// 获取全局状态信息
r.db("rethinkdb").table("stats").run(conn, callback);

// 获取集群状态信息
r.db("rethinkdb").table("stats").get(["cluster"]).run(conn, callback);

// 查询指定实例的状态信息
r.db("rethinkdb").table("stats").get(["server", "de8b75d1-3184-48f0-b1ef-99a9c04e2be5"]).run(conn, callback);

// 查询指定表的状态信息
r.db("rethinkdb").table("stats").get(["table", "31c92680-f70c-4a4b-a49e-b238eb12c023"]).run(conn, callback);

// 查询特定实例的特定表状态信息
// 第一个UUID为表UUID, 第二个UUID为实例UUID
r.db("rethinkdb").table("stats").get(["table_server", "31c92680-f70c-4a4b-a49e-b238eb12c023", "de8b75d1-3184-48f0-b1ef-99a9c04e2be5"]).run(conn, callback);
```

# 结构概要
每个对象的状态记录结构都不相同, 您可以用过查看字段名来了解这个字段是描述什么状态的.
当查询对象为`server`, `db`, `table`时您可以为`table`命令指定`identifier_format`参数来说明返回的记录由UUID显示还是由对象名显示.

## cluster
```json
{
  id: ["cluster"],
  query_engine: {
    queries_per_sec: <NUMBER>,
    read_docs_per_sec: <NUMBER>,
    written_docs_per_sec: <NUMBER>
  }
}
```

## server
```json
{
  id: ["server", <UUID>],
  server: <UUID> or <STRING>,
  query_engine: {
    queries_per_sec: <NUMBER>,
    queries_total: <NUMBER>,
    read_docs_per_sec: <NUMBER>,
    read_docs_total: <NUMBER>,
    written_docs_per_sec: <NUMBER>,
    written_docs_total: <NUMBER>,
    client_connections: <NUMBER>
  },
}
```

如果集群实例通讯超时, 则返回的是错误信息.

```json
{
  id: ["server", <UUID>],
  server: <UUID> or <STRING>,
  error: "Timed out. Unable to retrieve stats."
}
```

## table
```json
{
  id: ["table", <UUID>],
  table: <UUID> or <STRING>,
  db: <UUID> or <STRING>,
  query_engine: {
    read_docs_per_sec: <NUMBER>,
    written_docs_per_sec: <NUMBER>
  }
}
```

## replica (table/server pair)
```
{
  id: ["table_server", <UUID>, <UUID>]  // table_id, server_id
  server: <UUID> or <STRING>,
  table: <UUID> or <STRING>,
  db: <UUID> or <STRING>,
  query_engine: {
    read_docs_per_sec: <NUMBER>,
    read_docs_total: <NUMBER>,
    written_docs_per_sec: <NUMBER>,
    written_docs_total: <NUMBER>
  },
  storage_engine: {
      cache: {
        in_use_bytes: <NUMBER>
      },
      disk: {
        read_bytes_per_sec: <NUMBER>,
        read_bytes_total: <NUMBER>,
        written_bytes_per_sec: <NUMBER>,
        written_bytes_total: <NUMBER>,
        space_usage: {
          metadata_bytes: <NUMBER>,
          data_bytes: <NUMBER>,
          garbage_bytes: <NUMBER>,
          preallocated_bytes: <NUMBER>
        }
      }
   }
}
```