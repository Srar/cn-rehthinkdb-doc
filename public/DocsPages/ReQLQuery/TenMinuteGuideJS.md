# Ten-minute guide with RethinkDB and JavaScript


<div class="infobox ">
   <p><strong>开始之前:</strong></p>
   <ul>
      <li>确保你已经<a href="/docs/1-0">安装RethinkDB</a>—安装RethinkDB只需1分钟!</li>
      <li>确保你已经<a href="/docs/install-drivers/javascript/"></a>安装Javasciprt依赖.</li>
      <li>已经阅读完<a href="/docs/1-1">30秒快速入门</a>.</li>
   </ul>
</div>

<p>
    <img src="/DocsPages/images/10-minute-guide_javascript.png" class="api_command_illustration">
</p>

# 启动RethinkDB

如你不知道如何启动, 请阅读[30秒快速入门](/docs/1-1).

# 导入依赖

首先启动 Node.JS
```
$ node
```

然后导入RethinkDB依赖
```
r = require('rethinkdb');
```

现在你已经可以通过`r`来执行RethinkDB命令了

# 打开一个连接

当启动RethinkDB时, RethinkDB会开启一个___应用程序通讯端口___(默认28015)来让应用程序连接, 我们来连接这个端口
```
var connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;
})
```