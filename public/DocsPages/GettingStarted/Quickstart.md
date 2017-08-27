# RethinkDB 30秒快速入门

<div class="infobox">
    开始之前确保你已经 <a href="/#/Docs/1-0">安装RethinkDB</a>.
</div>

<p>
    <img src="/DocsPages/images/quickstart.png" class="api_command_illustration">
</p>

## 启动RethinkDB

首先启动RehinkDB. 在macOS或Linux下, 只需在命令行执行以下命令.

```
$ rethinkdb
info: Creating directory 'rethinkdb_data'
info: Listening for intracluster connections on port 29015
info: Listening for client driver connections on port 28015
info: Listening for administrative HTTP connections on port 8080
info: Server ready
```

Windows下你需要先开启命令行进入RethinkDB安装目录运行`rethinkdb.exe`.
```
C:\Users\Slava\RethinkDB\>rethinkdb.exe
info: Creating directory 'rethinkdb_data'
info: Listening for intracluster connections on port 29015
info: Listening for client driver connections on port 28015
info: Listening for administrative HTTP connections on port 8080
info: Server ready
```

打开浏览器访问`localhost:8080`你应该就能看见RehtinkDB自带的管理工具了.

## 运行一些奇怪的东西

点击 Data Explorer, 你可以在浏览器中操作Javascipt来使用RehtinkDB

现在我们在RehthinkDB默认数据库`test`中创建一个`tv_shows`表
```
r.db('test').tableCreate('tv_shows')
```
点击 Run按钮 或者按下 Shift+Enter来执行查询, 现在你可以输入一些JSON来插入数据至`tv_shows`表
```
r.table('tv_shows').insert([{ name: 'Star Trek TNG', episodes: 178 },
                            { name: 'Battlestar Galactica', episodes: 75 }])
```
最后，让我们做一个稍微更复杂的查询。 让我们找到所有超过100集的节目。
```
r.table('tv_shows').filter(r.row('episodes').gt(100))
```

## 下一步

恭喜你已经了解了基本操作！现在可以去看一下[10分钟快速了解](/#/Docs/2-0)，通过这篇文章你可以了解一些基本命令并能知道应用中如何使用RehtinkDB.

