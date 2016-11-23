# RethinkDB配置文件
`.conf`配置文件包含多个选项用于服务启动RethinkDB实例.
其选项与在命令行上启动RethinkDB实例的选项完全相同. 有关这些选项的更多详细信息, 请运行`rethinkdb help`.

配置文件的位置取决您的系统, 您还可以在启动参数使用`--config-file`来指定配置文件路径.

## 格式
[`.conf`示例配置文件](https://github.com/rethinkdb/rethinkdb/blob/next/packaging/assets/config/default.conf.sample)中提供了完整的注释.
(这个配置文件可能已经重命名为`default.conf.sample`于您的系统上)

该文件使用`key = value`的简单格式，每行指定一个键与值. 以下将展示如何使用配置文件标记实例并将其加入一个已经存在的集群内:
```
server-name=Kismet
server-tag=default
server-tag=fremont_ca
join=layered:29015
daemon
```

## 可用选项
下列配置中带有`<name>`, 表示为配置文件名字但不带`.conf`; 列如配置文件名为: `instance1.conf`, 那么`/var/run/rethinkdb/<name>/pid_file`则为`/var/run/rethinkdb/instance1/pid_file`

* `runuser` 与 `rungroup`: 指定使用哪个用户和组启动RethinkDB进程.

  ___默认:___ `rethinkdb`与`rethinkdb`

* `pid-file`: 保存进程ID的文件存放在那个路径(用于服务与实例通讯).

  ___默认:___ `/var/run/rethinkdb/<name>/pid_file`

* `directory`: 存放RethinkDB数据文件的目录路径. 请确保这个路径对`runuser`用户与`rungroup`组有读写权限.
  
  > 您可以使用`rethinkdb create --directory ...`命令自动为`runuser`用户与`rungroup`组创建数据目录.

  ___默认:___ `/var/lib/rethinkdb/<name>/`

* `log-file`: 存放日志文件路径.

  ___默认:___ `<directory>/log_file`

* `bind`: 设置要绑定哪些地址, 其值可以为: IP地址, all, 本机回环.

  ___默认:___ 本机回环地址

* `bind-http`: 类似于`bind`, 但是仅仅只会控制Web管理界面绑定的地址. 如您没有设置此值, 那么此值会从`bind`继承.

* `bind-cluster`: 类似于`bind`, 但是仅仅只会控制集群通讯绑定的地址. 如您没有设置此值, 那么此值会从`bind`继承.

* `bind-driver`: 类似于`bind`, 但是仅仅只会控制应用程序通讯绑定的地址. 如您没有设置此值, 那么此值会从`bind`继承.

* `http-tls-key`: Web管理界面TLS加密通讯的私钥文件路径. 您必须同时设置`http-tls-key`与`http-tls-cert`.

* `http-tls-cert`: Web管理界面TLS加密通讯的证书文件路径. 您必须同时设置`http-tls-key`与`http-tls-cert`.

* `driver-tls-key`: 应用程序TLS加密通讯的私钥文件路径. 您必须同时设置`driver-tls-key`与`driver-tls-cert`.

* `driver-tls-cert`: 应用程序TLS加密通讯的证书文件路径. 您必须同时设置`driver-tls-key`与`driver-tls-cert`.

* `driver-tls-ca`: 用于验证客户端驱动程序连接的CA证书包的文件名. 如果设置，实例将仅接受来自提供使用CA证书签名的证书的应用程序连接.

* `cluster-tls-key`: 集群之间TLS加密互相通讯的私钥文件路径. 您必须同时3个`cluster-tls-*`选项.

* `cluster-tls-cert`: 集群之间TLS加密互相通讯的证书文件路径. 您必须同时3个`cluster-tls-*`选项.

* `cluster-tls-ca`: 用于验证群集连接的CA证书文件路径. 您必须同时3个`cluster-tls-*`选项.

* `tls-min-protocol`: 实例接受的最低TLS协议版本: `TLSv1`, `TLSv1.1`, `TLSv1.2`.

  ___默认:___ `TLSv1.2`

* `tls-ciphers`: 使用的TLS加密套件.

  ___默认:___ `EECDH+AESGCM`

* `tls-ecdh-curve`: ECDHE椭圆曲线的标识符名.

  ___默认:___ `prime256v1`

* `tls-dhparams`: 如果使用DHE加密套件, 需要提供包含DHE密钥协商参数的文件名. 建议至少使用2048位密钥.

* `canonical-address`: 其他RethinkDB实例将用于连接到此服务器的地址. 如果实例使用的端口不是`29015`集群通讯端口, 那么地址必须以`IP:PORT`格式指定. 这个配置项可以被指定多次.

* `http-port`, `driver-port`, `cluster-port`: Web管理界面端口(默认`8080`), 应用程序通讯端口(默认`28015`), 集群之间通讯端口(默认`29015`).

* `join`: 以`IP:PORT`来指定集群中的节点. 这个配置项可以被指定多次.

* `port-offset`: 全部端口的自增值.

  ___默认:___ 0

* `no-http-admin`: 禁用Web管理界面.

* `cores`: 使用的线程数量.

  ___默认:___ 根据CPU线程数量自动指定.

* `cache-size`: 缓存大小. 单位MB.

  ___默认:___ 启动RethinkDB时可用内存的一半.

* `io-threads`: 并发I/O数量

  ___默认:___ 64

* `direct-io`: 直接访问磁盘文件系统.

* `server-name`: 实例名.

  ___默认:___ 从一个简短的名称列表中随机选择.

* `server-tag`: 实例标签, 用于对多实例的分组管理. 这个配置项可以被指定多次, 用于一个实例多个标签. 关于标签的更多信息请阅读[标记, 分片, 副本](/docs/5-1)

* `cluster-reconnect-timeout`: 如果实例与集群断开连接, 那么实例会在这个时间内不断尝试与集群恢复连接. 单位: 秒.
  
  ___默认:___ `86400`


 











