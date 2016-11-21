# 开机自动启动
本文档会介绍如何将RethinkDB作为服务来运行，并设置开启自动启动.

您必要按照下列步骤操作:
* 安装RethinkDB为系统服务器(在linux中基于`init.d`或者`systemd`. macOS中基于`launchd`)
* 为RethinkDB实例创建配置文件

# 基于init.d开机启动
RethinkDB packages会自动将服务脚本安装在`/etc/init.d/rethinkdb`并添加默认运行级别.
为了让RethinkDB开机自动启动, 您还需在`/etc/rethinkdb/instances.d/`中创建配置文件.

## 基本设置
复制默认配置文件至配置文件目录, 并参考[configuration file](#)对所需要的参数进行设置.
(如果您手滑把默认配置文件删了, 您可以从[这里](https://github.com/rethinkdb/rethinkdb/blob/next/packaging/assets/config/default.conf.sample)下载)

```
sudo cp /etc/rethinkdb/default.conf.sample /etc/rethinkdb/instances.d/instance1.conf
sudo vim /etc/rethinkdb/instances.d/instance1.conf
```

然后重启服务

```
sudo /etc/init.d/rethinkdb restart
```

目前已经完成基本设置了, 可以开始正常使用了.

## 多个实例
由于init.d在同一服务器上支持多个实例, 因此您只需在`/etc/rethinkdb/instances.d`中创建多个`.conf`文件即可. 
这可能需要隔离用于在同一服务器上运行单独应用的数据库, 或者用于测试目的.

在每个配置文件中, 可以来设置不同的数据目录, 并为每个节点添加`join`配置选项, 来加入不同的集群.
但是您需要确保每个实例的`driver-port`, `cluster-port`, `http-port`不会有冲突.

> 如果您将同一台物理服务器上开启多个实例并加入集群，这样并不会提升性能.

如您是将多个实例运行在多个服务器上请在配置文件中指定`bind=all`.
 
> 如果您在公网服务器使用`bind=all`那么这个操作具有风险, 你应该采取措施, 以防止未经授权的访问. 请阅读[security page](https://www.rethinkdb.com/docs/security/)来了解详细.

## 通过源码安装
如果您是通过源码安装的, 你可以点击右边这来获取`init.d`脚本与配置文件. [init.d 脚本](https://github.com/rethinkdb/rethinkdb/blob/next/packaging/assets/init/rethinkdb) 
& [配置文件](https://github.com/rethinkdb/rethinkdb/blob/next/packaging/assets/config/default.conf.sample)

# 基于systemd开机启动
完全支持systemd还没完成, 您可以查看[issue 2014](https://github.com/rethinkdb/rethinkdb/issues/2014)来了解进度.
目前您需要为服务手动创建几个配置文件.

## 基本设置
创建配置文件, 配置文件路径为: `/usr/lib/tmpfiles.d/rethinkdb.conf`. 其内容:
```
d /run/rethinkdb 0755 rethinkdb rethinkdb -
```

创建服务配置文件, 路径: `/usr/lib/systemd/system/rethinkdb@.service`:

```
[Unit]
Description=RethinkDB database server for instance '%i'

[Service]
User=rethinkdb
Group=rethinkdb
ExecStart=/usr/bin/rethinkdb serve --config-file /etc/rethinkdb/instances.d/%i.conf
KillMode=process
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```
并将刚刚创建的两个配置文件赋予644权限(`chmod 644 <file>`).

## 启动RethinkDB实例
首先为RethinkDB创建数据目录, 并为数据目录设置所有权为`rethinkDB`用户:
```
rethinkdb create -d /path/to/your/rethinkdb/directory
sudo chown -R rethinkdb.rethinkdb /path/to/your/rethinkdb/directory
```
然后复制默认配置文件至配置文件目录, 并参考[configuration file](#)对所需要的参数进行设置.
(如果您手滑把默认配置文件删了, 您可以从[这里](https://github.com/rethinkdb/rethinkdb/blob/next/packaging/assets/config/default.conf.sample)下载)
```
sudo cp /etc/rethinkdb/default.conf.sample /etc/rethinkdb/instances.d/instance1.conf
sudo vim /etc/rethinkdb/instances.d/instance1.conf
```
由于您上面复制的默认的配置文件，所以您需要修改数据目录为您刚刚创建的数据目录. 找到配置文件中的`directory=`行然后把数据目录路径追加在后面就行了.
```
directory=/path/to/your/rethinkdb/directory
```
然后就能启用服务了
```
sudo systemctl enable rethinkdb@<name_instance>
sudo systemctl start rethinkdb@<name_instance>
```
目前已经完成基本设置了, 可以开始正常使用了.

## 多实例
由于systemd在同一服务器上支持多个实例, 因此您只需在`/etc/rethinkdb/instances.d`中创建多个`.conf`文件即可. 
这可能需要隔离用于在同一服务器上运行单独应用的数据库, 或者用于测试目的.

在每个配置文件中, 可以来设置不同的数据目录, 并为每个节点添加`join`配置选项, 来加入不同的集群.
但是您需要确保每个实例的`driver-port`, `cluster-port`, `http-port`不会有冲突.

> 如果您将同一台物理服务器上开启多个实例并加入集群，这样并不会提升性能.

如您是将多个实例运行在多个服务器上请在配置文件中指定`bind=all`.
 
> 如果您在公网服务器使用`bind=all`那么这个操作具有风险, 你应该采取措施, 以防止未经授权的访问. 请阅读[security page](https://www.rethinkdb.com/docs/security/)来了解详细.

# 基于launchd开机启动(macOS)
如您使用[Homebrew](http://brew.sh/)来安装RethinkDB, 那么`launchd`配置文件会自动帮您安装在`~/Library/LaunchAgents/`, 不过自动安装的配置文件可能需要手动修改下.

## 基本设置
如果您没有使用Homebrew来自动安装RethinkDB, 那么您需要手动创建`launchd`配置文件并决定RethinkDB数据目录放在那.
本文档会使用以下路径进行设置:
* RethinkDB可执行文件: `/usr/local/bin/rethinkdb`
* RethinkDB数据目录: `/Library/RethinkDB/data`
* RethinkDB日志: `/var/log/rethinkdb.log`

如果您想存放的路径与本文档路径不同，请手动修改相关路径部分.

创建文件 `/Library/LaunchDaemons/com.rethinkdb.server.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.rethinkdb.server</string>
  <key>ProgramArguments</key>
  <array>
      <string>/usr/local/bin/rethinkdb</string>
      <string>-d</string>
      <string>/Library/RethinkDB/data</string>
  </array>
  <key>StandardOutPath</key>
  <string>/var/log/rethinkdb.log</string>
  <key>StandardErrorPath</key>
  <string>/var/log/rethinkdb.log</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>LowPriorityIO</key>
  <false/>
</dict>
</plist>
``` 
设置文件所有权为`root`用户:
```
sudo chown root:wheel /Library/LaunchDaemons/com.rethinkdb.server.plist
sudo chmod 644 /Library/LaunchDaemons/com.rethinkdb.server.plist
```
然后你需要创建数据目录:
```
sudo mkdir -p /Library/RethinkDB
sudo rethinkdb create -d /Library/RethinkDB/data
```

## 使用RethinkDB配置文件
默认情况下使用Homebrew或者其他安装方式, RethinkDB都不会读取上述的`.plist`配置文件. 如果您想让RethinkDB使用配置文件您可以按照已下步骤执行:
* 下载[默认配置文件](https://github.com/rethinkdb/rethinkdb/blob/next/packaging/assets/config/default.conf.sample)并复制到特定路径
```
sudo cp default.conf.sample /etc/rethinkdb.conf
```
* 根据您的需要编辑配置文件内的配置项. 当然您也可以不做编辑, 但是配置文件中有一项您必须修改, 那就是`directory=`. 其指向了数据目录在那个路径.
```
sudo vi /etc/rethinkdb.conf
```
* 编辑`/Library/LaunchDaemons/com.rethinkdb.server.plist`并为`ProgramArguments`添加一条配置, 指定配置文件路径:
```
<key>ProgramArguments</key>
<array>
    <string>/usr/local/bin/rethinkdb</string>
    <string>--config-file</string>
    <string>/etc/rethinkdb.conf</string>
</array>

## 启动RethinkDB实例
```
启动RethinkDB, 您需要使用`launchctl`:
```
sudo launchctl load /Library/LaunchDaemons/com.rethinkdb.server.plist
```

同时RethinkDB也会在开机的时候自动启动, 如果您不想RethinkDB自动启动, 您可以将`com.rethinkdb.server.plist`内的`RunAtLoad`下面一行改为`<false/>`.

## 多实例
在同一macOS上运行多个RethinkDB实例可能需要隔离用于在同一macOS上运行的单独应用程序的数据库，或者用于测试目的.

> 如果您将同一台物理服务器上开启多个实例并加入集群，这样并不会提升性能.

您需要创建一个新的`com.rethinkdb.server.plist`配置文件(如果您想开启两个实例, 那么第二个实例的配置文件应改成`com.rethinkdb.server2.plist`)
此外您还需要修改配置文件内的内容:

* 设置`Label`的值为配置文件名(列如文件名为`com.rethinkdb.server2.plist`, 其值就要和文件名相同).
* 设置`ProgramArguments`来指定新的RethinkDB配置文件路径(列如: `/etc/rethinkdb2.conf`).
* 设置`StandardOutPath`与`StandardErrorPath`改成新的日志文件路径.

在每个配置文件中, 可以来设置不同的数据目录, 并为每个节点添加`join`配置选项, 来加入不同的集群.
但是您需要确保每个实例的`driver-port`, `cluster-port`, `http-port`不会有冲突.

> 如果您在公网服务器使用`bind=all`那么这个操作具有风险, 你应该采取措施, 以防止未经授权的访问. 请阅读[security page](https://www.rethinkdb.com/docs/security/)来了解详细.
>
> 当在macOS下Python与Ruby会自动使用系统内自带的OpenSSL, 但是系统自带的OpenSSL是祖传版本并不支持RethinkDB TLS连接.
> 如您想使用TLS连接, 请确保OpenSSL支持以下特性:
> * `tls-min-protocol TLSv1`
> * `tls-ciphers EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH:AES256-SHA`

# 遇到错误
<div class="infobox">
   集群中的节点RethinkDB版本不能相差过大否则会无法加入集群<br/>
   节点的RethinkDB位数必须要一样列如32位实例无法加入64位实例的节点集群
</div>
<div class="infobox">
   RethinkDB实例加入集群时提示 <b>'received invalid clustering header'?</b><br />
    RethinkDB会占用机器三个端口分别作用是<b>Web管理界面</b>，<b>应用程序通讯端口</b>，<b>实例集群通讯端口</b> <br />
    你可以在浏览器中打开<b>Web管理界面</b>通过浏览器快速管理RethinkDB<br/>
    应用程序(列如一个nodejs应用)可以通过<b>应用程序通讯端口</b>来执行查询操作<br/>
    当你启用集群模式时各个节点会使用<b>实例集群通讯端口<b/>通讯<br/><br/>
    如果你启动集群实例时指定错端口则会发生'received invalid clustering header'提示<br/>
</div>