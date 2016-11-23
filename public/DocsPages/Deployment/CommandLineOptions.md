# RethinkDB命令行参数
以下选项可以在RethinkDB实例启动时使用启动参数设定. 
同时以下大部分选项也能够使用配置文件中设定, 请阅读[RethinkDB配置文件](/docs/6-2)来了解详细.

## 文件选项
* `-d [ --directory ] path`: 指定路径来存放RethinkDB数据库数据文件以及metadata.
* `--io-threads n`： 并发I/O数量.
* `--direct-io`: 直接操作文件, 不经过文件系统缓存.
* `--cache-size mb`: 缓存大小, 其值能为`auto`.

## 实例名称选项
* `-n [ --server-name ] arg`: 实例名称, 如果您不指定, 那么会从一个名称列表中自动选取一个.
* `-t [ --server-tag ] arg`: 实例tag, 可以通过指定多次来实现一个实例多个tag.

## 网络选项
* `--bind {all | addr}`: 设置要绑定哪些地址, 其值可以为: IP地址, all, 本地回环. 默认为本地回环.
* `--bind-http {all | addr}`: 类似于`bind`, 但是仅仅只会控制Web管理界面绑定的地址. 如您没有设置此值, 那么此值会从`bind`继承.
* `--bind-cluster {all | addr}`: 类似于`bind`, 但是仅仅只会控制集群通讯绑定的地址. 如您没有设置此值, 那么此值会从`bind`继承.
* `--bind-driver {all | addr}`: 类似于`bind`, 但是仅仅只会控制应用程序通讯绑定的地址. 如您没有设置此值, 那么此值会从`bind`继承.
* `--no-default-bind`: 禁用自动绑定本地回环, 除非在单独的`--bind`选项中明确指定.
* `--cluster-port port`: 集群节点通讯端口.
* `--driver-port port`: 应用程序通讯端口.
* `-o [ --port-offset ] offset`: 全部端口自增值.
* `-j [ --join ] host:port`: 要连接的RethinkDB节点的主机和端口.
* `--reql-http-proxy [protocol://]host[:port]`: 用于`r.http(...)`命令的代理, 默认连接代理端口为`1080`.
* `--canonical-address addr`: 其他RethinkDB实例将用于连接到此服务器的地址.
* `--cluster-reconnect-timeout secs`: 如果实例与集群断开连接, 那么实例会在这个时间内不断尝试与集群恢复连接. 默认`86400`秒.

## TLS选项
* `--http-tls-key key_filename`: Web管理界面TLS加密通讯的私钥文件路径.
* `--http-tls-cert cert_filename`: Web管理界面TLS加密通讯的证书文件路径.
>  您必须同时设置`http-tls-key`与`http-tls-cert`.
* `--driver-tls-key key_filename`: 应用程序TLS加密通讯的私钥文件路径.
* `--driver-tls-cert cert_filename`: 应用程序TLS加密通讯的证书文件路径. 
* `--driver-tls-ca ca_filename`: 用于验证客户端连接的CA证书文件名. 如果设置，实例将仅接受来自提供使用CA证书签名的证书的应用程序连接. 
> `--driver-tls-key`与`--driver-tls-cert`必须一起使用, `--driver-tls-ca`可选.
* `--cluster-tls-key key_filename`: 集群之间TLS加密互相通讯的私钥文件路径.
* `--cluster-tls-cert cert_filename`: 集群之间TLS加密互相通讯的证书文件路径.
* `--cluster-tls-ca ca_filename`: 用于验证群集连接的CA证书文件路径. 
> `--cluster-tls-*`3个选项必须同时使用.
* `--tls-min-protocol protocol`: 接受的最低TLS协议版本: `TLSv1`, `TLSv1.1`, `TLSv1.2`. 默认: `TLSv1.2`.
* `--tls-ciphers cipher_list`: 使用的TLS加密套件. 默认: `EECDH+AESGCM`.
* `--tls-ecdh-curve curve_name`: ECDHE椭圆曲线的标识符名. 默认: `prime256v1`.
* `--tls-dhparams dhparams_filename`: 如果使用DHE加密套件, 需要提供包含DHE密钥协商参数的文件名. 建议至少使用2048位密钥.

有关这些选项的详细信息, 请阅读[集群安全](/docs/6-1)

## Web管理界面选项
* `--web-static-directory directory`: Web管理界面静态资源目录.
* `--http-port port`: Web管理界面端口.
* `--no-http-admin`: 禁用Web管理界面.

## CPU选项
* `-c [ --cores ] n`: 使用CPU线程数量.

## 服务选项
* `--pid-file path`: 存放实例进程运行时的PID.
* `--daemon`: 后台运行RethinkDB进程.

## 运行用户组选项
* `--runuser user`: 以指定用户运行.
* `--rungroup group`: 以指定组运行.

## 安全选项
* `--initial-password`: 指定`admin`用户的密码. 如果您使用`auto`那么会自动生成一个密码, 并通过`stdout`打印出来.(有关这个选项的详细信息, 请阅读[集群安全](/docs/6-1))

## 帮助选项
* `-h [ --help ]`: 打印帮助.
* `-v [ --version ]`: 打印RethinkDB版本.

## 日志选项
* `--log-file file`: 日志文件存放的路径. 默认为`log_file`.
* `--no-update-check`: 禁用检测可用新版本, 同时关闭匿名数据上报.

## 配置文件选项
* `--config-file`: 指定配置文件路径.

## 子命令
* `rethinkdb create`: 创建新实例数据文件.
* `rethinkdb serve`: 使用现有数据目录托管数据和提供查询.
* `rethinkdb proxy`: 作为Proxy节点运行(不会存储集群内任何数据).
* `rethinkdb export`: 从集群或实例中导出数据至文件或者文件夹.
* `rethinkdb import`: 导入文件或文件夹至集群或者实例.
* `rethinkdb dump`: 导出并且压缩数据至文件或者文件夹.
* `rethinkdb restore`: 导如压缩数据至集群或者实例.
* `rethinkdb index-rebuild`: 重建索引.

了解更多子命令, 请在命令行输入`rethinkdb help [subcommand]`.

了解Proxy节点请阅读[标记, 分片, 副本](/docs/5-1)中`运行代理节点`.
