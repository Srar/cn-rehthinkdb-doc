# 管理工具

RethinkDB为您提供了一个Web管理界面, 通过Web管理界面您可以直接管理整个RethinkDB实例或者实例集群. 
也可以通过Web管理界面来管理表分片和复制. 还可以在Web管理界面中直接运行ReQL命令, 记住您运行过的ReQL命令并为您提供查询性能分析视图.

# Web管理界面
![webui](/DocsPages/images/webui.png)

当RethinkDB运行后您可以浏览器访问`http://localhost:8080`来访问Web管理界面.

Web管理界面监听端口默认为localhost:8080监听本地回环地址是为了安全考虑. 
如果您需要从外部访问Web管理界面您可以在RethinkDB启动参数加上`--bind all`来监听全部IP端口.

# ReQL管理命令
您为您擅长的编程语言安装好RethinkDB库以后就可以通过您擅长的编程语言来管理RethinkDB了.
您可以通过ReQL命令来[设置分片以及复制](https://www.rethinkdb.com/api/python/reconfigure), [平衡分片](https://www.rethinkdb.com/api/python/rebalance), 还有更多管理操作.
另外您可以通过查询[系统表](https://www.rethinkdb.com/docs/system-tables/)来了解实例集群状态.

在这篇文章中例子将会使用Python. 如您想使用其他语言您可以阅读不同语言的API文档来来了解命令, 以及命令的返回值.

## 使用REPL
加载`python`并设置连接至RethinkDB数据库

```python
import rethinkdb as r
r.connect('localhost', 28015).repl()
```
现在您可以使用ReQL命令来查询系统表或者来更改配置.您可以查询`rethinkdb`数据库的`server_status`系统表来了解RethinkDB实例情况:

```python
list(r.db('rethinkdb').table('server_status').run())

[
    {
        "id": "6df17842-93a1-45ab-958a-491aff391776",
        "name": "OrangePi",
        "network": {
            "canonical_addresses": [
                {
                    "host": "127.0.0.1",
                    "port": 29015
                },
                {
                    "host": "192.168.0.210",
                    "port": 29015
                },
                {
                    "host": "::1",
                    "port": 29015
                },
                {
                    "host": "fe80::b816:aff:fed5:4f7c%2",
                    "port": 29015
                }
            ],
            "cluster_port": 29015,
            "connected_to": {
                "RaspberryPi": true
            },
            "hostname": "orangepi",
            "http_admin_port": 8080,
            "reql_port": 28015,
            "time_connected": {
                "$reql_type$": "TIME",
                "epoch_time": 1479126019.552,
                "timezone": "+00:00"
            }
        },
        "process": {
            "argv": [
                "/opt/rethinkdb/bin/rethinkdb",
                "--daemon",
                "--config-file",
                "/opt/rethinkdb/etc/rethinkdb//instances.d/default.conf",
                "--pid-file",
                "/var/run/rethinkdb/rethinkdb.pid"
            ],
            "cache_size_mb": 100,
            "pid": 1906,
            "time_started": {
                "$reql_type$": "TIME",
                "epoch_time": 1479126019.534,
                "timezone": "+00:00"
            },
            "version": "rethinkdb 2.3.5 (GCC 4.8.2)"
        }
    },
    {
        "id": "d8bb5258-b9c1-4a4d-922f-1b4d6c033bca",
        "name": "RaspberryPi",
        "network": {
            "canonical_addresses": [
                {
                    "host": "127.0.0.1",
                    "port": 29015
                },
                {
                    "host": "127.0.1.1",
                    "port": 29015
                },
                {
                    "host": "192.168.0.100",
                    "port": 29015
                },
                {
                    "host": "192.168.0.220",
                    "port": 29015
                },
                {
                    "host": "::1",
                    "port": 29015
                },
                {
                    "host": "fe80::ba27:ebff:fe19:a93f%2",
                    "port": 29015
                }
            ],
            "cluster_port": 29015,
            "connected_to": {
                "OrangePi": true
            },
            "hostname": "raspberrypi",
            "http_admin_port": 8080,
            "reql_port": 28015,
            "time_connected": {
                "$reql_type$": "TIME",
                "epoch_time": 1479126019.534,
                "timezone": "+00:00"
            }
        },
        "process": {
            "argv": [
                "/opt/rethinkdb/bin/rethinkdb",
                "--daemon",
                "--config-file",
                "/opt/rethinkdb/etc/instances.d/default.conf",
                "--runuser",
                "rethinkdb",
                "--rungroup",
                "rethinkdb",
                "--pid-file",
                "/var/run/rethinkdb/default/pid_file",
                "--directory",
                "/var/lib/rethinkdb/default/data"
            ],
            "cache_size_mb": 100,
            "pid": 7822,
            "time_started": {
                "$reql_type$": "TIME",
                "epoch_time": 1478676729.16,
                "timezone": "+00:00"
            },
            "version": "rethinkdb 2.3.5 (GCC 4.9.2)"
        }
    }
]
```

如果您想了解表的信息您可以使用[status](https://www.rethinkdb.com/api/python/status)命令:

```javascript
r.table('movies').status().run()

{
    "db": "test",
    "id": "97884898-bc83-4aa3-b5f9-9de2883318a9",
    "name": "movies",
    "raft_leader": "RaspberryPi",
    "shards": [
        {
            "primary_replicas": [
                "RaspberryPi"
            ],
            "replicas": [
                {
                    "server": "RaspberryPi",
                    "state": "ready"
                }
            ]
        },
        {
            "primary_replicas": [
                "OrangePi"
            ],
            "replicas": [
                {
                    "server": "OrangePi",
                    "state": "ready"
                }
            ]
        }
    ],
    "status": {
        "all_replicas_ready": true,
        "ready_for_outdated_reads": true,
        "ready_for_reads": true,
        "ready_for_writes": true
    }
}
```

当然您也可以重新配置表, 配置表使用[reconfigure](https://www.rethinkdb.com/api/python/reconfigure)命令:

```
r.table('a').reconfigure(shards=2, replicas=2).run()

r.table('b').reconfigure(shards=2, replicas={'us_east':2, 'us_west':2,
    'london':2}, primary_replica_tag='us_east').run()
```

`Data Explorer`在Web管理界面中使用Javascript为交互环境, 并提供ReQL高亮以及ReQL执行历史.

## 脚本语言与ReQL
ReQL配合脚本语言例如Python会使得您管理或者配置RethinkDB更加方便. 
如果您可能需要为新表或对整个数据库进行调整或复杂配置，则可以将ReQL在脚本中.

```python
import rethinkdb as r
conn = r.connect('localhost', 28015)

# 配置`database`数据库全部表
r.db('database').reconfigure(shards=2, replicas=3).run(conn)

# 配置特定表
tables = ['users', 'posts', 'comments']
for table in tables:
    r.table(table).reconfigure(shards=3, replicas=2).run(conn)

# 配置与日志无关的所有表
tables = [t for t in r.table_list().run() if 'log_' not in t]
for table in tables:
    r.table(table).reconfigure(shards=2, replicas=3).run(conn)

# 使用`table_config`系统表来查看所有表配置
configs = r.db('rethinkdb').table('table_config').run()

# 'configs'配置还原至表
for config in configs:
    r.db('rethinkdb').table('table_config').get(
    config['id']).update(config).run(conn)
```





