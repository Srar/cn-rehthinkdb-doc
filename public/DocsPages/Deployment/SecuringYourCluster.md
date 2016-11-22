# 集群安全

<p>
    <img src="/DocsPages/images/secure-cluster.png" class="api_command_illustration">
</p>

保护RethinkDB集群的最佳方法是完全在内网运行, 然而对于每个集群都要求这样是不可能的. 列如在公有云上部署然后需要从广域网访问.

主要有两种办法来保护RethinkDB集群: 对连接使用TLS加密, 并将服务器使用的端口绑定到特定IP地址以限制外部连接.

# 使用 TLS
从2.3版本开始RethinkDB支持实例与实例之间, 实例与客户端之间的加密通讯, 并且Web管理界面也可以使用TLS加密通讯.
以这种方式保护RethinkDB类似于使用自签名SSL证书保护网站: 创建私钥和证书, 然后告诉服务器使用它们.

## 生成密钥并自签证书
最简单的方法是使用`openssl`(Linux与macOS中系统已经自带了openssl, Windows请在openssl wiki上寻找[已经编译好的可执行文件](https://wiki.openssl.org/index.php/Binaries)).

首先, 生成一个2048位的密钥并保存到key.pem:
```
openssl genrsa -out key.pem 2048
```
然后通过密钥来生成证书`cert.pem`:
```
openssl req -new -x509 -key key.pem -out cert.pem -days 3650
```
OpenSSL将要求您输入证书的信息. 虽然其中一些问题可以使用默认值, 但"Common Name"必须与您的服务器的域名相匹配. 
对于本地测试目的, 可以使用`localhost`, 但不能用于生产环境.
```
Country Name (2 letter code) [AU]:US
State or Province Name (full name) [Some-State]:California
Locality Name (eg, city) []:Mountain View
Organization Name (eg, company) [Internet Widgits Pty Ltd]:RethinkDB
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:example.com
Email Address []:
```

## 配置RethinkDB使用证书
您可以通过[命令行参数](https://www.rethinkdb.com/docs/cli-options/)或者在配置文件中指定密钥与证书.
这样当访问Web管理界面时就能够使用TLS加密通讯了. 在命令行参数指定:
```
rethinkdb --http-tls-key key.pem --http-tls-cert cert.pem
```
在配置文件中您可以这样指定:
```
http-tls-key=key.pem
http-tls-cert=cert.pem
```
要求___客户端___使用TLS连接:
```
rethinkdb --driver-tls-key key.pem --driver-tls-cert cert.pem
```
如果您在实例指定了要求客户端使用TLS连接, 那么客户端连接也必须使用加密连接.

当客户端连接时用的`connect`命令加入`ssl`参数来使用TLS加密连接. 阅读API文档的[connect](https://www.rethinkdb.com/api/javascript/connect/)命令来了解更多.

在集群内实例互相通讯, 可以这样指定参数:
```
rethinkdb --cluster-tls-key key.pem --cluster-tls-cert cert.pem --cluster-tls-ca cert.pem
```
> 在集群内实例互相通讯别忘记指定CA证书, 其是用于签发其他子证书的证书.
> 我们为两者使用相同的证书, 但我们可以使用不同的CA证书签署我们的cert.pem, 并指定它们. 
> 如果由其`cluster-tls-cert`值指定的证书由`cluster-tls-ca`指定的CA证书签名, 实例只能连接到集群(原文: Servers can only connect to the cluster if the certificates specified by their cluster-tls-cert value are signed by the CA certificate specified by cluster-tls-ca.).

<br>

> 当在macOS下Python与Ruby会自动使用系统内自带的OpenSSL, 但是系统自带的OpenSSL是祖传版本并不支持RethinkDB TLS连接.
> 如您想使用TLS连接, 请确保OpenSSL支持以下特性:
> * `tls-min-protocol TLSv1`
> * `tls-ciphers EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH:AES256-SHA`

# admin账户
每个RethinkDB实例都有一个`admin`账户, `admin`账户有全部访问集群的权限, 并且这个账户默认是没有密码的(有关账户的全部信息，请阅读[用户帐号与用户权限](/docs/5-2))
当集群创建好后的第一件事应该就是给`admin`用户创建一个密码. 您可以在实例启动时候指定`--initial-password`来指定密码, 或者通过更新[系统表](/docs/5-5)内`admin`账户密码.

当有新实例(包括代理节点)加入已存在的集群, 新实例会同步集群内已有的帐号信息(包括`admin账户`)至新实例.
不管如何一个无`admin`密码的实例是__无法加入__有`admin`密码的集群内的.

如果您在一个安全环境中创建集群(列如整个集群在防火墙之后), 那么您可以放心使用无密码启动实例, 然后再更新`admin`密码.
但是您想加入一个已经受密码保护的集群, 那么最好的办法是在实例启动参数加上`--initial-password auto`选项.

`--initial-password auto`选项会帮您随机为`admin`账户创建一个密码, 当实例加入集群后, 实例就会同步集群内的账户信息. 相当于把随机密码给覆盖了.

```
rethinkdb --initial-password auto --join cluster
```

# 绑定Web管理界面端口
可以为Web管理界面绑定特定地址来防止外部访问实例.
您可以使用`--bind-http`命令来将其绑定至特定的IP上. 最安全的办法是绑定至`localhost`, 然后通过代理访问Web管理界面.
```
rethinkdb --bind-http localhost
```
如您现在绑定了`localhost`, 那么想要安全的访问Web管理界面有以下两种办法:
* __使用SOCKS代理__

  可以通过SSH命令非常方便在服务器上建立Socks代理, 您可以在您的电脑上运行以下命令:
  ```
  ssh -D 3000 USERNAME@HOST
  ```
  * `HOST` RethinkDB实例或集群的服务器IP.
  * `3000` SSH在您电脑上创建Socks服务监听端口.

  然后打开您的浏览器:
  * __Chrome__: 前往 __设置 > 高级设置 > 网络 > 修改代理设置__, 然后将按以下内容填写:
    * 地址: `localhost`
    * 端口: `3000`
    * 忽略的主机: `删除全部内容`
  * __FireFox__: 前往 __编辑 > 性能. 然后点击 高级 > 网络 > 设置__并创建代理配置:
    * 地址: `localhost`
    * 端口: `3000`
    * 选择Socks5
    * 不经过代理的地址: `删除全部内容`

  现在您就可以通过浏览器输入地址`localhost:8080`来访问Web管理界面了.

* __使用反向代理__

  您可以为http服务器设置反向代理web管理界面, 大多数web服务器(列如Apache, Nginx)都是支持反向代理的. 在这个文档中我们使用Apache作为例子:
    
  Apache设置反向代理之前请确保已经为Apache安装了以下模块:

  * proxy
  * proxy_http
  * libapache2-mod-proxy-html(部分系统要求安装)

  创建一个虚拟主机:
    ```
    <VirtualHost *:80>
        ServerName domain.net

        ProxyRequests Off

        <Proxy *>
            Order deny,allow
            Allow from all
            AuthType Basic
            AuthName "Password Required"
            AuthUserFile password.file
            AuthGroupFile group.file
            Require group dbadmin
        </Proxy>

        ProxyErrorOverride On
        ProxyPass   /rethinkdb_admin/   http://localhost:8080/
        ProxyPassReverse   /rethinkdb_admin/   http://localhost:8080/

    </VirtualHost>
    ```
    在`/etc/apache2/`创建密码文件:
    ```
    htpasswd.exe -c password.file username
    ``` 
    当以上步骤都完成时, 还需要创建最后一个文件: `group.file`:
    ```
    dbadmin: username
    ```
    现在您就能够通过`http://HOST/rethinkdb_admin`访问Web管理界面了.


# 应用程序加密通讯
## 使用RethinkDB自身鉴权系统
当使用[connect](https://www.rethinkdb.com/api/javascript/connect)命令来连接RethinkDB时, 指定`user`与`password`参数.
了解更多关于RethinkDB账户权限请阅读[用户帐号与用户权限](/docs/5-2)

要注意的时当您没有使用TLS加密连接时, 密码会以明文发送. 如果您不想使用TLS加密连接, 您可以使用SSH隧道来连接RethinkDB. 

> 鉴权系统仅仅会对应用程序连接进行鉴权，而不会对Web管理界面进行鉴权.

## 使用SSH隧道
为了保护应用程序端口不会被全世界的人都能连上, 您可以在RethinkDB启动时指定`--bind-driver`[启动选项](https://www.rethinkdb.com/docs/cli-options/)来绑定到`localhost`:
```
rethinkdb --bind-driver localhost
```
现在您可以创建一个SSH隧道在应用服务器上将RethinkDB应用程序端口映射至服务器.
```
ssh -L <local_port>:localhost:<driver_port> <ip_of_rethinkdb_server>
```
* `local_port`: 在应用服务器上创建的映射端口
* `driver_port`: RethinkDB应用程序端口
* `ip_of_rethinkdb_server`: RethinkDB实例所在服务器IP地址

现在您可以通过`localhost`与`local_port`来连接RethinkDB实例了：

```javascript
r.connect({host: 'localhost', port: <local_port>},
    function(error, connection) { ... })
```
   
# 绑定集群端口

要保护集群端口，您可以在RethinkDB启动时指定`--bind-cluster`将其绑定到只能从内网访问的IP地址.
```
rethinkdb --bind-cluster 192.168.0.100
```

