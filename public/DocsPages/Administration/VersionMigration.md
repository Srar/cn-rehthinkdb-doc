# 版本迁移
将数据从RethinkDB旧版本迁移至新版本, 迁移步骤取决于迁移版本.
* __1.16或更高__: 内部自动处理(这也适用于从1.14版本升级到2.2之前的版本). 完全迁移后请执行『重建索引』操作.
* __1.13–1.15__: 首先升级到RethinkDB 2.0.5执行『重建索引』操作, 然后升级到2.1或者更高版本.(2.0.5升级至2.1+会由内部自动处理).
* __1.7–1.12__ : 请阅读『迁移旧数据』操作.
* __1.6 or earlier__ : 请阅读『祖传版本』操作.

## 备份数据
虽然在升级前您可以不备份数据, 但是备份下又没多大事（:
您在升级前通过`dump`命令来备份RethinkDB内数据. 
需要注意的是老版本的RethinkDB是无法使用新版本RethinkDB数据文件的(列如1.13版本是无法使用1.14版本数据文件的).

在bash中使用`dump`子命令来创建数据备份文件, 备份文件会由json文档以及其他表元数据组成为一个tar.gz文件.
```
rethinkdb dump [options]
```
使用`restore`子命令可以将备份数据恢复至您的集群.
```
rethinkdb restore filename
```
您可以通过`rethinkdb help <command>`来查看选项列表. 有关更多详细信息, 请阅读[备份数据](/docs/5-4).

> `dump`与`restore`依赖于[Python driver](https://www.rethinkdb.com/docs/install-drivers/python/). 在备份数据前请不要把Python driver升级到最新版本.<br/><br/>
> 如果您还没有安装Python driver您可以通过`pip install rethinkdb==<version>`来安装(点击[这里](https://pypi.python.org/pypi/rethinkdb)来查看Python driver历史版本).

## 重建索引
当您升级跨度为主版本时(列如2.1->2.2), 应该手动重建索引:
```
rethinkdb index-rebuild
```
如果您是从1.16之前版本升级上来前请务必先升级到2.0.5版本(RethinkDB版本存档可以从[这里](https://drethinkdb.x-speed.cc/)下载).
如果您是从1.16或更高版本升级的话可以直接升级到2.2或者更高版本.
> 如果要在次要版本(列如2.2.0->2.2.1)之间升级, 则不需要重建索引.

## 迁移旧数据文件
___这个步骤是正对1.7-1.12->2.1或更高版本___. 如果您的RethinkDB不是这个版本区间内, 请阅读『重建索引』内容.

> 如果您使用的是1.6或者更早版本请阅读『祖传版本』内容.

迁移数据只有简单的三步:
* 从现有的RethinkDB中导出数据
* 升级RethinkDB
* 导入数据进新版本RethinkDB

> __您必须通过导出数据来升级RethinkDB版本. 如果您已经手贱升级, 请下载[历史版本](https://drethinkdb.x-speed.cc/)回滚.

__导出数据__

使用`rethinkdb dump`来导出数据:
```
rethinkdb dump -c <host>:<port>
```
这个命令会将数据导出到文件名规则为`rethinkdb_dump_<timestamp>.tar.gz`的文件中.
您可以通过`rethinkdb help <command>`来查看选项列表. 有关更多详细信息, 请阅读[备份数据](/docs/5-4).

__升级RethinkDB__

安装最新的RethinkDB与您编程语言RethinkDB依赖库.
* 阅读[安装RethinkDB](/docs/1-0).
* 阅读[安装依赖库](/docs/1-2).
新版本安装完毕后请确定您已经删除或者移动了RethinkDB数据文件文件夹(默认文件名:`rethinkdb_data`), 因为新版本RethinkDB无法读取版本跨度过大的老版本数据文件.

__导入数据__

使用`rethinkdb restore`来导入数据:
```
rethinkdb restore <exported_file> -c <host>:<port>
```
您可以通过`rethinkdb restore <command>`来查看导入选项列表. 有关更多详细信息, 请阅读[备份数据](/docs/5-4).

导入数据完毕后, 您需要重建索引:
```
rethinkdb index-rebuild
```

> 集群配置不会导出至备份文件, 全部步骤完成后您需要重新配置.

## 祖传版本
我们没有测试过从1.6或者更低版本升级到2.1或者更高版本. 您也许可以试试已经弃坑的[迁移脚本](https://github.com/rethinkdb/rethinkdb/tree/02b4f29e1e7f15b3edffcb68bf015578ec5783ab/scripts/migration).
