# 备份数据
您可以在命令行中使用RethinkDB子命令`dump`, `restore`来备份或者还原您的数据. 
工具会运行在`admin`账户上.

## 备份
使用子命令`dump`可以为集群或者实例内数据创建一个由JSON文档和其他表元数据组成的tar.gz文件.
```
rethinkdb dump [options]
``` 
使用`dump`选项可以让您指定集群并说明要备份数据库还是特定表.
* `-c`, `--connect`: 指定连接的集群或者实例 (默认: `localhost:28015`)
* `-f`, `--file`: 输出文件的文件名 (默认: `rethinkdb_dump_<date>_<time>.tar.gz`)
* `-e`, `--export`: 导出数据库或者导出表(specified as `database.table`); 可以指定多次来导出多个数据库或者多个表
* `-p`, `--password`: 如果实例已设置`admin`密码则后续需要输入密码
* `--password-file`: 从文本中读取`admin`密码
* `--tls-cert`: 指定TLS证书路径并使用加密连接 (see [Securing the cluster][sec])
* `--clients`: 最大并发同时导出表 (默认: `3`)
* `--temp-dir`: 临时目录
* `-h`, `--help`: 帮助

RethinkDB备份进程依赖[Python RethinkDB库](https://www.rethinkdb.com/docs/install-drivers/python/), 并在备份过程中使用并发备份. 
并发备份可能会占用一部分集群资源, 但是备份期间不会锁定任何其他连接. 所以请放心备份.

__例子__

```
rethinkdb dump -c fortress:39500
```
连接至主机名为`fortress`并且实例端口为`39500`的集群内，其备份文件名使用默认文件名规则保存.

```
rethinkdb dump -e league.users -f backup.tar.gz --password-file pw.txt
```
连接至默认的实例(`localhost:28015`)并备份`league`数据库的`users`表至`backup.tar.gz`. 同时使用`pw.txt`的内容作为admin账户鉴权密码.

> __Note:__ `dump`命令会备份表或者数据库的内容与元数据, 但是__不会备份__集群配置信息.

## 还原
`restore`子命令的大多数参数与`dump`一样, 尽管有一些额外的命令来控制数据导入的方式.

```
rethinkdb restore filename
```
您必须要指定需要恢复数据的备份文件名
* `-c`, `--connect`: 指定连接的集群或者实例 (默认: `localhost:28015`)
* `-p`, `--password`: 如果实例已设置`admin`密码则后续需要输入密码
* `--password-file`: 从文本中读取`admin`密码
* `--tls-cert`: 指定TLS证书路径并使用加密连接 (see [Securing the cluster][sec])
* `-i`, `--import`: 将备份还原至数据库或者表(例如: `database.table`);可以指定多次来还原多个数据库或者多个表
* `--clients`: 最大并发同时导出表 (默认: `8`)
* `--temp-dir`: 临时目录
* `--hard-durability`: 将数据直接写入至硬盘不经过内存缓冲(较慢，但是内存占用较少)
* `--force`: 如果表已经存在依然导入数据
* `--no-secondary-indexes`: 不要为导入的表创建索引
* `-h`, `--help`: 帮助

> __Note:__ `rethinkdb restore`可能无法将高版本的备份文件还原至低版本的RethinkDB内. 例如使用RethinkDB 2.2备份的数据文件将无法还原至RethinkDB 2.1.
>
> 如果您真的需要这样为低版本RethinkDB还原数据您可以在`restore`加上`--no-secondary-indexes`参数. 但是这样做不保证100%可用.

__例子__

```
rethinkdb restore rethinkdb_dump_2015-09-17T10:59:58.tar.gz
```
还原至默认集群 (localhost:28015)

```
rethinkdb restore backup.tar.gz -c fortress:39500
```
为主机名`fortress`并且端口为`39500`的实例集群还原`backup.tar.gz`内的数据.

```
rethinkdb restore backup.tar.gz -i league.users --password-file pw.txt
```
还原至默认集群, 但是只还原`league`数据库的`users`表从`backup.tar.gz`, 同时使用`pw.txt`的内容作为admin账户鉴权密码.

