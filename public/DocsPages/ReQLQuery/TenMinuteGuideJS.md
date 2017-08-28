# 10分钟使用JavaScript来快速入门RethinkDB


<div class="infobox ">
   <p><strong>开始之前:</strong></p>
   <ul>
      <li>确保你已经<a href="/#/Docs/1-0">安装RethinkDB</a>—安装RethinkDB只需1分钟!</li>
      <li>确保你已经<a href="/#/Docs/drives/javascript">安装JavaSciprt RethinkDB库</a>.</li>
      <li>已经阅读完<a href="/#/Docs/1-1">30秒快速入门</a>.</li>
   </ul>
</div>

<p>
    <img src="/DocsPages/images/10-minute-guide_javascript.png" class="api_command_illustration">
</p>

# 启动RethinkDB

如你不知道如何启动, 请阅读[30秒快速入门](/#/Docs/1-1).

## 导入依赖

首先启动 Node.JS
```
$ node
```

然后导入RethinkDB依赖
```
r = require('rethinkdb');
```

现在你已经可以通过`r`来执行RethinkDB命令了

## 打开一个连接

当启动RethinkDB时, RethinkDB会开启一个___应用程序通讯端口___(默认28015)来让应用程序连接, 我们来连接这个端口:

```javascript
var connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;
})
```
现在变量`connection`已经被初始化，我们可以用它来执行查询

## 创建新表

一般来说RethinkDB会默认有一个`test`数据库，我们在这个数据库中创建一个`authors`表:

```javascript
r.db('test').tableCreate('authors').run(connection, function(err, result) {
    if (err) throw err;
    console.log(JSON.stringify(result, null, 2));
})
```

返回:
```json
{
    "config_changes": [
        <table configuration data>
    ],
    "tables_created": 1
}
```

config_changes表示创建表的信息, 如果想了解更多 请查阅[tableCreate](#)命令.

关于此查询，您应注意以下几点:

* 首先我们使用了`db`方法来选择`test`数据库
* 然后我们使用了`tableCreate`方法来预创建表
* 最后我们调用了`run(connection, callback)`将查询发送至RethinkDB实例

全部的ReQL查询均是这种规律. 我们已经成功创建表了, 现在我们往表中插入一点数据. 

## 插入数据

我们插入三条数据至`authors`表:
```
r.table('authors').insert([
    { name: "William Adama", tv_show: "Battlestar Galactica",
      posts: [
        {title: "Decommissioning speech", content: "The Cylon War is long over..."},
        {title: "We are at war", content: "Moments ago, this ship received word..."},
        {title: "The new Earth", content: "The discoveries of the past few days..."}
      ]
    },
    { name: "Laura Roslin", tv_show: "Battlestar Galactica",
      posts: [
        {title: "The oath of office", content: "I, Laura Roslin, ..."},
        {title: "They look like us", content: "The Cylons have the ability..."}
      ]
    },
    { name: "Jean-Luc Picard", tv_show: "Star Trek TNG",
      posts: [
        {title: "Civil rights", content: "There are some words I've known since..."}
      ]
    }
]).run(connection, function(err, result) {
    if (err) throw err;
    console.log(JSON.stringify(result, null, 2));
})
```
执行查询后我们应该会看到RethinkDB返回了这样一个对象:
```
{
    "unchanged": 0,
    "skipped": 0,
    "replaced": 0,
    "inserted": 3,
    "generated_keys": [
        "7644aaf2-9928-4231-aa68-4e65e31bf219",
        "064058b6-cea9-4117-b92d-c911027a725a",
        "543ad9c8-1744-4001-bb5e-450b2565d02c"
    ],
    "errors": 0,
    "deleted": 0
}
```
RethinkDB应该会返回0个错误以及已经插入3条数据

我们现在还没有为表指定主键, 所以RethinkDB会为这3条数据自动生成主键(id字段 uuid)并通过`generated_keys`数组返回

有关此查询的几个要注意的事项：
* 当连接设置数据库后会在连接生命周期中一直使用这个数据库(如果你没有指定数据库, 那么会自动设置`test`数据库). 
  这样我们就可以省略`db('test')`了，如果你不想省略`db('test')`那也不会出错.
* `insert`命令可以接受单个数据或者多个数据, 如果你想插入多个数据就可以和刚刚一样传递数组而不是执行多次insert命令

## 查询数据

刚刚我们插入了一些数据, 现在我们看看如何通过查询把这些数据取出来!

___查询表全部数据___

查询`authors`表中全部数据仅仅只需要的使用`r.table('authors')`:
```
r.table('authors').run(connection, function(err, cursor) {
    if (err) throw err;
    cursor.toArray(function(err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
    });
});
```
打印的结果就应该是刚刚插入的三条数据，其中还包含了RethinkDB为我们自动生成的主键ID

由于表可能会存放成百万的数据，因此RethinkDB会返回一个游标。当你遍历游标时RethinkDB会一条一条数据发至你的应用程序.
在我们上面的例子中因为我们清楚表中只存放了3条数据, 所以我们可以使用.toArray来自动遍历游标并把数据全部放进数组.

___根据条件查询数据___

现在尝试查找`name`字段为`William Adama`的数据. 我们可以使用`filter`来过滤返回为`false`的数据:
```
r.table('authors').filter(r.row('name').eq("William Adama")).
    run(connection, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, result) {
            if (err) throw err;
            console.log(JSON.stringify(result, null, 2));
        });
    });
```
这个查询会返回表游标. `filter`会查询表中`name`符合条件的行并返回符合条件的全部行.

* `r.row`         表示数据字段 
* `r.row('name')` 被访问数据的字段名称
* `eq` 当两个值相等时返回`true` 在这个例子中我们使用的是`name`字段是否与字符串`William Adama`相等

现在我们再使用下`filter`来返回超过两个发帖数的作者
```
r.table('authors').filter(r.row('posts').count().gt(2)).
    run(connection, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, result) {
            if (err) throw err;
            console.log(JSON.stringify(result, null, 2));
        });
    });
```
* `count`表示数组的长度
* `gt` 当数值大于指定值时返回`true`(上面列子中如果大于2那么就返回`true`)

## 根据主键查询数据

我们可以使用`get`来通过主键查询数据, 这里我们使用上面列子中生成的`id`:
```
r.table('authors').get('7644aaf2-9928-4231-aa68-4e65e31bf219').
    run(connection, function(err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
    });
```
因为主键是唯一的, 所以`get`仅会返回一条记录.这样我们就不需要.toArray转换成数组了.

<div class="infobox ">
   <p>想了解RethinkDB如何使用索引来查询数据请点击<a href="/#/Docs/2-2">这里</a>.</p>
</div>

## ChangeFeeds

RethinkDB通过暴露一个令人兴奋的新访问模型来颠覆传统的数据库架构 - 开发人员可以告诉RethinkDB不断向应用程序实时推送更新的查询结果，而不是轮询结果。

开始使用实时推送我们打开一个新命令行并创建一条新RethinkDB连接, 然后执行以下查询.
```
r.table('authors').changes().run(connection, function(err, cursor) {
    if (err) throw err;
    cursor.each(function(err, row) {
        if (err) throw err;
        console.log(JSON.stringify(row, null, 2));
    });
});
```
现在回到第一个命令行, 我们随便更新或删除一条记录. 在执行查询后RethinkDB会推送记录通知你的应用程序. 以上代码会在命令行打印这些消息.
```
{
  "new_val": {
    "id": "1d854219-85c6-4e6c-8259-dbda0ab386d4",
    "name": "Laura Roslin",
    "posts": [...],
    "tv_show": "Battlestar Galactica",
    "type": "fictional"
  },
  "old_val": {
    "id": "1d854219-85c6-4e6c-8259-dbda0ab386d4",
    "name": "Laura Roslin",
    "posts": [...],
    "tv_show": "Battlestar Galactica"
  }
}
```
RethinkDB将通知您的程序`authors`表中的所有更改，并在返回的结果中包含修改前和修改后的记录.
你可以查看这里了解实时Feeds的更多技巧.

## 更新数据

现在我们将数据表中的全部数据字段加一列`type`.
```
r.table('authors').update({type: "fictional"}).
    run(connection, function(err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
    });
```
由于我们更新了三条记录, 所以返回结果应该是这样：
```
{
    "unchanged": 0,
    "skipped": 0,
    "replaced": 3,
    "inserted": 0,
    "errors": 0,
    "deleted":0
}
```
注意因为我们选择了表中全部的作者然后链式调用`update`来更新记录，当然我们也可以先过滤出指定作者然后正对指定作者更新.
在此我们更新`William Adama`的记录让`William Adama`记录添加一个`rank`字段
```
r.table('authors').
    filter(r.row("name").eq("William Adama")).
    update({rank: "Admiral"}).
    run(connection, function(err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
    });
```
由于我们只更新了一条记录, 所以返回结果应该是这样：
```
{
    "unchanged": 0,
    "skipped": 0,
    "replaced": 1,
    "inserted": 0,
    "errors": 0,
    "deleted": 0
}
```
`update`允许更改数据中的现有字段, 以及数组内的值. 让我们假设星际迷航考古学家发现了Jean-Luc Picard新的演讲，我们想添加一条记录到他的帖子：
```
r.table('authors').filter(r.row("name").eq("Jean-Luc Picard")).
    update({posts: r.row("posts").append({
        title: "Shakespeare",
        content: "What a piece of work is man..."})
    }).run(connection, function(err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
    });
```
在执行此查询后Jean-Luc Picard的帖子中会额外新增一条

## 删除数据

假设现在我们要减少我们的数据库大小，我们需要删除发帖总数小余3个的作者
```
r.table('authors').
    filter(r.row('posts').count().lt(3)).
    delete().
    run(connection, function(err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
    });
```
由于我们数据库中有两位作者发帖总数小余3, 所以返回结果应该是这样：
```
{
    "unchanged": 0,
    "skipped": 0,
    "replaced": 0,
    "inserted": 0,
    "errors": 0,
    "deleted": 2
}
```

## 了解更多

<div class="infobox">
<ul>
  <li>阅读<a href="/#/Docs/2-1">了解 ReQL</a>来更深入学习ReQL.</li>
  <li>了解如何在RethinkDB中使用<a href="/#/Docs/2-5">map-reduce</a>.</li>
  <li>了解如何在RethinkDB中使用<a href="/#/Docs/2-4">表连接</a>.</li>
  <li>阅读[ReQL 最佳实践](/#/Docs/4-3)来查看更多示例.</li>
</ul>
</div>