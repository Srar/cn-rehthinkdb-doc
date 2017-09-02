# 异常恢复
虽然我们尽可能保证RethinkDB实例自身可用性, 但是如同其他复杂应用程序一样崩溃是不可避免的.

## 崩溃前的操作

__检查您是不是用完了内存__

您可以检查是不是因为内存不足导致内核干掉了RethinkDB实例进程:
```
sudo dmesg | grep oom
```
有可能您会看到类似下面的输出
```
rethinkdb invoked oom-killer: gfp_mask=0x201da, order=0, oom_adj=0, oom_score_adj=0
 [<ffffffff8111d272>] ? oom_kill_process+0x82/0x2a0
```
如果您看到了类似上面的输出, 您可以尝试调小RethinkDB缓存大小.
有关内存缓存的信息, 以及如何调整缓存请阅读[Understanding RethinkDB memory requirements](#).

__检查日志__

日志文件的路径取决于RethinkDB配置文件内所设置的路径以及如何启动RethinkDB实例的.

* 如您直接在bash中执行`rethinkdb`命令来启动实例的话那么日志会在数据目录`rethinkdb_data`下的`log_file`内.
但是如果您在启动时候使用`--log-file`指定了日志路径, 那么日志就不会再数据目录内了.

* 如您使用Linux下`systemd`启动实例, 您可以通过`journalctl`来浏览日志:

  `journalctl -u rethinkdb@<instance>`

* 如您是以包安装RethinkDB并且不使用`systemd`服务管理器, 那您可以前往`/var/log/`看下是否有RethinkDB日志文件.

日志可能会提供有关崩溃的关键信息.

__社区支持__

如果您遇到的问题不是由于内存满了, 并且日志内也无异常, 
那么您可以试试去IRC[#rethinkdb on freenode](http://webchat.freenode.net/?channels=#rethinkdb)或者
[Google Group](http://groups.google.com/group/rethinkdb)碰碰运气. 看看有没有大触能为您解答问题.

## 如何提交RethinkDB Bug

您可以在我们的Github issue上开启问题[https://github.com/rethinkdb/rethinkdb/issues](https://github.com/rethinkdb/rethinkdb/issues)

提出issue时我们需要您提供以下信息:
* `rethinkdb --version`输出的全部内容, 列如:
  `rethinkdb 1.13.3 (CLANG 5.1 (clang-503.0.40))`
* `uname -a`输出的全部内容, 列如:
  `arwin rethink.local 13.3.0 Darwin Kernel Version 13.3.0: Tue Jun 3 21:27:35 PDT 2014; root:xnu-2422.110.17~1/RELEASE_X86_64 x86_64`
* 如果在日志中有异常堆栈, 请提供日志.

还有一些其他信息可以帮助我们定位错误, 如果您有以下信息的话.
* [系统表](/#/docs/5-5)内信息
* `rethinkdb._debug_table_status`内记录
* The core file, if it was  on crash
* 如果RethinkDB由于数据文件无法启动的数据文件.
* `rethinkdb`实例启动时候的输出.
* 集群设置(几个节点, 网络拓扑)
* 还有一些关于您服务器的信息:
  * 有多少内存?
  * 文件系统是啥?
  * 是否跑在虚拟机中?
* 异常是否可以重现, 如何触发异常的.

## 导出系统表
在Web管理界面的Data Explorer中执行以下命令. 其会输出最多50行内容. 其中包括各类配置, 状态, 以及日志表.

```javascript
r.expr(["current_issues", "jobs", "stats", "server_config", "server_status",
"table_config", "table_status", "db_config", "cluster_config"]).map(
    [r.row, r.db('rethinkdb').table(r.row).coerceTo('array')]
).coerceTo('object').merge(
    {logs: r.db('rethinkdb').table('logs').limit(50).coerceTo('array')}
)
```

## 设置高可用

RethinkDB支持您对表创建副本, 最大创建副本的数量取决您集群内的节点数量.
您可以通过Web管理界面很方便的设置副本, 或者通过不是很方便的ReQL来设置.
更多信息请阅读[标记, 分片, 副本](/#/docs/5-1).

RethinkDB目前还不能支持全自动故障转移, 当集群内节点发生故障时, 您可以手动剔除节点.
在大多数情况下RethinkDB会自动保证表可用. 了解更多信息请阅读[故障转移](/#/docs/5-3).