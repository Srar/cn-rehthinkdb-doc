# 开始使用 RethinkDB

<div class="infobox">
    <p>这篇文档将帮助你了解如何在命令行中使用多个参数来启动RethinkDB.<br/>
    设置单个机器上单个RethinkDB实例至多个RethinkDB实例 或 多个机器多个RethinkDB实例.</p>
</div>

## 启动RethinkDB

首先启动第一个RethinkDB实例
```
$ rethinkdb
info: Creating directory /home/user/rethinkdb_data
info: Listening for intracluster connections on port 29015
info: Listening for client driver connections on port 28015
info: Listening for administrative HTTP connections on port 8080
info: Server ready
```
可以通过在启动时候提示的端口来访问RethinkDB实例

* 在分布式环境可以使用intracluster port来让其他节点来访问本机节点 (默认端口：29015)
* 在本机浏览器中打开administrative port可以访问当前实例的管理界面 (默认端口：8080)

<div class="infobox">
    <p>如果你想了解全部的启动参数可以输入命令`rethinkdb --help`来查询.</p>
</div>

## 单机多RethinkDB实例集群

向现有RethinkDB分布式集群添加节点非常容易，就像开启新的RethinkDB实例一样. 集群操作均有系统自动处理, 不需要用户额外操作.


现在我们在本机启动第二个RethinkDB实例：
```
$ rethinkdb --port-offset 1 --directory rethinkdb_data2 --join localhost:29015
info: Creating directory /home/user/rethinkdb_data2
info: Listening for intracluster connections on port 29016
info: Attempting connection to 1 peer...
info: Connected to server "Chaosknight" e6bfec5c-861e-4a8c-8eed-604cc124b714
info: Listening for client driver connections on port 28016
info: Listening for administrative HTTP connections on port 8081
info: Server ready
```

___你现在已经有一个RethinkDB集群了! ___ 你可以通过浏览器访问`localhost:8080`或`localhost:8081`来使用Web管理界面
如果你点击`Server`标签, 你应该能看到两个实例已经处于一个分布式集群内了.

现在你可以使用客户端来访问`localhost:28015`或`localhost:28016`来执行查询(你不需要知道那个是主实例, 系统会将查询自动分发至对应节点)

第二个节点启动参数说明
* --port-offset — 将当前实例全部端口偏移 确保不会有端口占用冲突.
* --directory   — 指定数据文件存储目录 确保多个实例不会访问同一个存储目录.
* --join        — 连接至另一个实例 (本文中我们连接的是本机 所以是`localhost:29015`).

如果你想了解全部的启动参数可以输入命令`rethinkdb --help`来查询.

<div class="infobox">
   <p>无法访问Web管理界面？
    可以尝试在启动参数追加`--bind all`来启动RethinkDB<br />
    <b style="color: #f35151;">RethinkDB自身Web管理界面没有提供管理员认证！建议使用iptables阻挡非本机IP连接Web管理界面</b></p>
</div>

在实际操作中你肯定希望通过配置文件来启动RethinkDB而不是命令行操作. 你可以查阅这里来了解配置文件.
此外你应该也希望RethinkDB在启动时自动启动, 你可以点击这里了解使用init.d或systemd来设置开机自动启动.

<div class="infobox">
    <p>想增加第三个节点？<br />
    可以通过以上方法增加第三个节点，只需随便在现有集群中选取一个节点即可.</p>
</div>

## 多机多RethinkDB实例分布式集群

在多台机器上创建集群比在单机上更容易, 因为不需要担心端口冲突以及数据目录问题.

首先开启第一个RethinkDB实例在第一台机器上
```
$ rethinkdb --bind all
```
开启第二个RethinkDB实例在第二台机器上
```
$ rethinkdb --join 第一台IP:29015 --bind all
```
___你现在已经有一个RethinkDB分布式集群了! ___

<div class="infobox">
    <p><b style="color: #f35151;">RethinkDB自身Web管理界面没有提供管理员认证！<br />
    建议使用iptables阻挡非本机IP连接Web管理界面 或 建立IP白名单</b></p>
</div>

如果你的RethinkDB是绑定公网IP，请查阅RethinkDB安全须知.

## 遇到错误
<div class="infobox">
   <p>集群中的节点RethinkDB版本不能相差过大否则会无法加入集群<br/>
   节点的RethinkDB位数必须要一样列如32位实例无法加入64位实例的节点集群</p>
</div>
<div class="infobox">
   <p>RethinkDB实例加入集群时提示 <b>'received invalid clustering header'?</b><br />
    RethinkDB会占用机器三个端口分别作用是<b>Web管理界面</b>，<b>应用程序通讯端口</b>，<b>实例集群通讯端口</b> <br />
    你可以在浏览器中打开<b>Web管理界面</b>通过浏览器快速管理RethinkDB<br/>
    应用程序(列如一个nodejs应用)可以通过<b>应用程序通讯端口</b>来执行查询操作<br/>
    当你启用集群模式时各个节点会使用<b>实例集群通讯端口<b/>通讯<br/><br/>
    如果你启动集群实例时指定错端口则会发生'received invalid clustering header'提示</p>
</div>