# ReQL 最佳实践

<p>
    <img src="/DocsPages/images/cookbook.png" class="api_command_illustration">
</p>

# 基本命令

## 创建一个数据库 ##

您可以使用`dbCreate`命令来创建数据库:

```javascript
r.dbCreate("blog").run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

另一种创建数据库的办法是使用RethinkDB Web界面. 您可以通过`http://HOST:8080`来访问Web界面. 在导航栏上点击_Tables_然后点击_Add Database_按钮.

## 重命名数据库 ##

重命名数据库的最简单办法是使用 [config](https://www.rethinkdb.com/api/javascript/config/) 命令 
来访问 `db_config` [RethinkDB系统表](/docs/system-tables/), 然后使用`update`命令.

```js
r.db("old_db_name").config().update({name: "new_db_name"}).run(conn,
    function(err, result) {
        if (err) throw err;
        console.log(result);
    }
);
```

## 创建一个表 ##

您可以通过`db`命令来选择一个数据库然后使用`tableCreate`命令:

```javascript
r.db("blog").tableCreate("posts").run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

您也可以忽略`db`命令，这样RethinkDB会缺省默认选择`test`数据库

另一种创建数据库的办法是使用RethinkDB Web界面. 您可以通过`http://HOST:8080`来访问Web界面. 在导航栏上点击_Tables_然后点击_Add Table_按钮.

## 插入记录 ##

您可以在对应的表使用`insert`命令来插入记录:

```javascript
r.table("user").insert({
    name: "Michel",
    age: 26
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

您还可以使用一次`insert`命令来插入多条记录，如下所示:

```javascript
r.table("user").insert([
    {
        name: "Michel",
        age: 26
    },
    {
        name: "Slava",
        age: 30
    }
]).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 删除记录 ##

删除记录前请先选择出您需要删除的记录然后再使用`delete`命令，列如我想删除『Michel』发的全部帖子:

```javascript
r.table("posts").filter(r.row("author").eq("Michel")).delete().run(conn,
    function(err, result) {
        if (err) throw err;
        console.log(result);
    }
);
```

或者通过主键删除单个记录:

```javascript
r.table("posts").get("7644aaf2-9928-4231-aa68-4e65e31bf219").delete().run(conn,
    function(err, result) {
        if (err) throw err;
        console.log(result);
    }
);
```

下面我们来删除表中全部记录:

```javascript
r.table("posts").delete().run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 查询记录 ##

直接使用`table`命令可以获取表中全部记录:

```javascript
r.table("posts").run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

由于`table`会返回一个游标，所以我们应该拿[next](https://www.rethinkdb.com/api/javascript/next/)或者
[each](https://www.rethinkdb.com/api/javascript/each/)命令来遍历结果集。或者您也可以直接使用
[toArray](https://www.rethinkdb.com/api/javascript/to_array/)来帮您直接转换成数组.

使用`get`命令来获取单个记录:

```javascript
r.table("posts").get(1).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

我想查找表记录中特定字段的值我可以使用`filter`命令:

```javascript
r.table("posts").filter({author: "Michel"}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

如果您已经为字段建立[索引](/docs/2-2)可以使用`getAll`命令:

```javascript
r.table("posts").getAll("review", {index: "category"}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

(For more complex filtering recipes, read on.)

# Filtering

## 过滤多个字段 ##

假设您想获取名字是『Michel』且类别是『Geek』的全部帖子，您可以这样:

```javascript
r.table("posts").filter({
    author: "Michel",
    category: "Geek",
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

您也可以在`filter`命令中使用`and`命令来构建相同结果的查询

```javascript
r.table("posts").filter(
    r.row("author").eq("Michel").and(r.row("category").eq("Geek"))
).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

您还可以直接将`r.and`作为`filter`命令的参数:

```javascript
r.table("posts").filter(
    r.and(r.row("author").eq("Michel"), r.row("category").eq("Geek"))
).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

ReQL中也有`r.or`供您调遣.

## 过滤字段数组中的值 ##

假设在`users`表中有这样一条记录:

```json
{
    name: "William Adama"
    emails: ["bill@bsg.com", "william@bsg.com"],
    ship: "Galactica"
}
```

我们想查找`emails`字段数组中有没有包含`user@email.com`的用户，可以使用`contains`来判断数组中有没有相同的值:

```javascript
r.table("user").filter(r.row("emails").contains("user@email.com"))
 .run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

再比如使用数组条件来查找`ship`字段记录值是不是『Galactica』或者『Pegasus』:

```js
r.table("user").filter(function (user) {
    return r.expr(["Galactica", "Pegasus"]).contains(user("ship"))
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 过滤嵌套字段 ##

Javascript中访问嵌套对象会使用`[]`比如`["user"]["age"]`, 在ReQL中会使用`()`来访问嵌套字段

假设`users`表中有一条这样的记录:

```json
{
    name: "William Adama"
    contact: {
        phone: "555-5555"
        email: "bill@bsg.com"
    }
}
```

我们来看看用户的`contact`.`email`有没有等于『user@email.com』的:

```javascript
r.table("user").filter(
    r.row("contact")("email").eq("user@email.com")
).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

您也可以使用类似JSON样式的表达式来告诉RethinkDB要查询那个字段，阅读[访问嵌套字段](http://localhost:3000/docs/2-3)了解更多.

## 通过主键同时获取多个记录 ##

如果您想通过`posts`表来获取主键为`1`, `2`, `3`的记录可以使用`getAll`命令:

```javascript
r.table("posts").getAll(1, 2, 3).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 通过索引同时获取多个记录 ##

假设`posts`表中有一个`author_id`字段来代表帖子的作者，同时我们已经给`author_id`创建了索引。
我们想获取`author_id`为`1`, `2`, `3`的记录。这时我们还可以使用`getAll`命令来获取

```javascript
r.table("posts").getAll(1, 2, 3, {index: 'author_id'})
 .run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```
> 阅读[RethinkDB中创建使用索引](/docs/2-2)来了解更多.

## 获取全部记录通过游标数组 ##

如果您调用的命令返回了游标不过您可能想直接拿到一个数组，那么您可以使用[toArray](https://www.rethinkdb.com/api/javascript/to_array/)命令.

```js
r.table('posts').run(conn, function(err, cursor) {
    if (err) throw err;
    cursor.toArray(function(result) {
        console.log(result);
    });
});
```

阅读[ReQL中的数据类型](/docs/3-0)了解更多关于streams或游标的信息.

## 返回记录中的特定字段 ##

如果您的记录中有非常多的字段，不过您只需要两个字段记录值的话可以使用`pluck`命令. 举个例子我目前只想知道`users`表记录中的 `name`与 `age`字段值:

```javascript
r.table("users").pluck("name", "age").run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

这个查询同等与在SQL中的`SELECT name, age FROM users`

`pluck`命令还支持嵌套字段的选择，假设我们想获取`phone`和`email`:
```json
{
    name: "William Adama"
    contact: {
        phone: "555-5555"
        email: "bill@bsg.com"
    }
}
```
可以使用以下语法:
```javascript
r.table("users").pluck(
    {contact: {phone: true, email: true}}
).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```


## 过滤时间 ##

假设您想获取2012年1月1日(包括)-2013年1月1日(不包括)，您可以这样干:

```js
r.table("posts").filter(function(post) {
    return post("date").during(r.time(2012, 1, 1, 'Z'), r.time(2013, 1, 1, 'Z'));
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

或者通过比较日期来过滤

```js
r.table("posts").filter(function(post) {
    return post("date").ge(r.time(2012, 1, 1, 'Z')).and(
        post("date").lt(r.time(2013, 1, 1, 'Z')));
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```


## 使用正则表达式来过滤 ##

如果你想查询出`lastName`已『Ma』开头的用户可以使用`r.match`来传入正则表达式来查找:

```js
// 将会返回列如: Martin, Martinez, Marshall etc.
r.table("users").filter(function(user) {
    return user("lastName").match("^Ma");
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

您可能又想获取`lastName`已『s』结尾的用户，和上面例子一样还是用`r.match`:

```js
// 将会返回列如: Williams, Jones, Davis etc.
r.table("users").filter(function(user) {
    return user("lastName").match("s$");
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

您可能再想获取下`lastName`包含『ll』的用户，还是用`r.match`:

```js
// 将会返回列如: Williams, Miller, Allen etc.
r.table("users").filter(function(user) {
    return user("lastName").match("ll");
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 忽略大小写正则过滤 ##

查询`name`是『William』(不区分大小写)的用户

```js
//  将会返回列如: william, William, WILLIAM, wiLLiam etc.
r.table("users").filter(function(user) {
    return user("name").match("(?i)^william$");
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 同时执行对多个字段进行聚合查询 ##

如果您想需要返回不同字段上的聚合查询那么可以使用[map-reduce](https://www.rethinkdb.com/docs/map-reduce).

在这里我们使用[探索ReQL命令](/docs/4-1)时的IMDb Top 250电影数据集. 假设你想获取排名前25的投票总计投票与前25的电影平均上映年份.
大概步骤:使用使用`rank`字段来获取前25的电影，`avg()`来平均年份，`sum()`来累加`votes`字段. 

说干就干我们先用[map][]来获取排名前25名的电影并丢到一个临时表, 并添加一个`count`字段, 
然后使用[reduce][]来遍历刚刚的临时表并将里面的3个字段类型累加(`votes`, `year` and `count`).
最后使用[do][]来返回总票数，其中的平均年份呢我们刚刚累加`count`字段，所以将累加的`year`除`count`字段就是平均年份了.

[map]: /api/javascript/map/
[reduce]: /api/javascript/reduce/
[do]: /api/javascript/do/

```js
r.table('movies').orderBy('rank').limit(25).map(function (doc) {
    return { totalVotes: doc('votes'), totalYear: doc('year'), count: 1 };
}).reduce(function (left, right) {
    return {
        totalVotes: left('totalVotes').add(right('totalVotes')),
        totalYear: left('totalYear').add(right('totalYear')),
        count: left('count').add(right('count'))
    };
}).do(function (res) {
    return {
        totalVotes: res('totalVotes'),
        averageYear: res('totalYear').div(res('count'))
    };
}).run(conn, callback);
```

RethinkDB团队在搞一个更简单的同时执行对多个字段进行聚合查询命令您可以[点击这里](https://github.com/rethinkdb/rethinkdb/issues/1725)查看进度

# 记录操作

## 添加字段或者更新字段值 ##

添加字段或者更新字段值您可以使用`update`命令. 举个例子如果您想把`posts`表中全部记录加一个`author`字段并且值为『Michel』您可以这样写:

```javascript
r.table("posts").update({ author: "Michel" }).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 删除记录字段 ##

`update`仅仅允许您更新字段值或者添加字段并不允许您删除字段. 
如果您想删除字段可以使用`replace`命令. 
`replace`命令会用传入参数替换原有记录. 举例说明: 我想把`posts`表中主键为『1』记录的`author`字段干掉，我可以这样写:

```javascript
r.table("posts").get("1").replace(r.row.without('author'))
 .run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 原子更新多个记录 ##

使用`update`和`replace`更新单个记录时更新是原子操作.
例如，假设我们希望在字段`countable`设置为`true`的情况下以原子方式更新页面的视图计数，并在单个查询中返回旧的和新的结果。 可以这样写:

```javascript
r.table("pages").update(function(page) {
    return r.branch(page("countable").eq(true),  // 如果这个是countable
        { views: page("views").add(1) },         // 那么计数+1
        {}                                       // 否则啥都不干
    );
}, {returnChanges: true}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 执行条件插入与更新 ##

当插入新记录或者更新一个已经存在的记录可以用branch和replace命令来维持`updated_at`and`created_at`字段原记录(we can use branch and replace to maintain a document’s updated_at and created_at fields by either inserting a new document or updating one depending on whether a document with a specified ID exists.).

```javascript
r.table('users').get(id).replace(function (doc) {
    return r.branch(
        doc.eq(null),
        r.expr(userObject).merge({id: id, created_at: r.now()}),
        doc.merge(userObject).merge({updated_at: r.now()})
    )
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 存储时间戳或者时间字符串为时间类型 ##

您可以使用 `epochTime` 和 `ISO8601` 命令来转换Unix时间戳和JSON时间字符串(ISO 8601格式)成ReQL的时间类型. 
RethinkDB依赖库还可以将JavaScript`Date`对象自动转换为ReQL的时间类型

```js
var theDate = new Date();
var timestamp = theDate.getTime();
var JSONDate = theDate.toJSON();
r.table("dates").insert({
    from_object: theDate,
    from_epoch: r.epochTime(timestamp/1000.0),
    from_iso: r.ISO8601(JSONDate)
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

同样您也可以使用`epochTime` 和 `ISO8601`在转回来.

## 自增字段值 ##

可以自增记录中字段的值类似`i++`, ReQL中如下:

```js
r.table('aggregated').get(id).update(
    { count: r.row('count').default(0).add(1) }
).run(conn, callback);
```
使用`default`可以保证当自增的字段不存在时自动创建`count`字段，而不是抛出异常.

# 分页

## 限制记录返回数量 ##

您可以使用`limit`命令限制查询返回的记录数量, 现在我只想获取10个帖子：

```javascript
r.table("posts").orderBy("date").limit(10).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 分页 ##

RethinkDB中有很多方法实现分页.
最简单暴力的是使用`skip` 与 `limit`命令(类似传统SQL中`OFFSET` 与 `LIMIT`), 但是这样效率太弱鸡.
这里有效率更高的命令列如: `slice`, 还有更高的列如`between`. 由于`between`使用了索引所以效率非常6.

[slice]()会返回目标开始的值但是不包括目标结尾的值由于这样很多人会喜欢使用`skip` 与 `limit`.下面将演示查询一个表第1个~第3个记录

表数据:

```javascript
r.table("test").run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});

[
    {
        "boom": 5,
        "id": "167fc073-810f-42c5-91aa-24c9fec574cd"
    },
    {
        "boom": 4,
        "id": "88b749be-c3d4-4d67-b5a8-21fc4c92fb8b"
    },
    {
        "boom": 1,
        "id": "d41bd0e3-f1ea-4d6c-98a2-7868842d412a"
    },
    {
        "boom": 3,
        "id": "ed2cca82-3dc7-4e78-81e1-b635ba32b8cb"
    },
    {
        "boom": 2,
        "id": "d7873634-feff-4b35-8faf-88319a076055"
    }
]
```

查询表第1个~第3个记录

```javascript
r.table("test").orderBy("boom").slice(0,3).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});

[
    {
        "boom": 1,
        "id": "d41bd0e3-f1ea-4d6c-98a2-7868842d412a"
    },
    {
        "boom": 2,
        "id": "d7873634-feff-4b35-8faf-88319a076055"
    },
    {
        "boom": 3,
        "id": "ed2cca82-3dc7-4e78-81e1-b635ba32b8cb"
    }
]
```

如果您为表字段建立了索引, 
您可以使用[between](https://www.rethinkdb.com/api/javascript/between)配合[orderBy](https://www.rethinkdb.com/api/javascript/order_by)与`limit`完成分页.
这是分页的最有效的方法，但是需要在索引字段中查找值以查找每个页面的第一个记录。

假设您有一个用户表, 您想分页展示每次展示25个用户. 首次分页您可以这样直接使用`limit`:

```javascript
r.table("users").orderBy({index: "name"}).limit(25).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

对于接下来的每一页可以通过姓氏来知道下一页:

```javascript
r.table("users").between(lastName, r.maxval, {leftBound: "open", index: "name"})
 .orderBy({index: "name"}).limit(25).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

每次分页都可以查询上次分页的`lastName`给`between`作为索引. 当我们第一次使用上次`lastName`结果时`lastName`会为`Null`会从头开始索引.
其中`leftBound`会告诉不包括第一条记录因为第一条记录已经包含在了上一个分页内.(
We pass the `lastName` saved from the previous set to `between` as the start index. For the end index, we pass `null` to return documents from the start index to the table's end. The `leftBound` parameter tells `between` not to include the first record, since it was already returned as part of the previous page.)

# Transformations

## 计算表内全部记录数 ##

您可以通过`count`命令来知道表内有多少记录:

```javascript
r.table("posts").count().run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 计算字段值的平均值 ##

您可以通过`avg`命令来知道表字段值的平均值:

```javascript
r.table("posts").avg("num_comments").run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 使用子查询返回其他字段 ##

假设我们要查询`posts`表中全部文章的记录，但是我们还想拿到文章的评论. 而文章的评论是存在`comments`表中的. 这时候我们就可以使用子查询来肛了:

```javascript
r.table("posts").merge(function(post) {
    return {
        comments: r.table("comments").filter(function(comment) {
            return comment("id_post").eq(post("id"))
        }).coerceTo("ARRAY")
    }
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 记录转字段操作(Performing a pivot operation) ##

假设又一个`marks`表存储着每位学生每门课的成绩:

```js
[
    {
        "name": "William Adama",
        "mark": 90,
        "id": 1,
        "course": "English"
    },
    {
        "name": "William Adama",
        "mark": 70,
        "id": 2,
        "course": "Mathematics"
    },
    {
        "name": "Laura Roslin",
        "mark": 80,
        "id": 3,
        "course": "English"
    },
    {
        "name": "Laura Roslin",
        "mark": 80,
        "id": 4,
        "course": "Mathematics"
    }
]
```

您应该会想看到下面的成绩结果会看的比较爽:

```js
[
    {
        "name": "Laura Roslin",
        "Mathematics": 80,
        "English": 80
    },
    {
        "name": "William Adama",
        "Mathematics": 70,
        "English": 90
    }
]
```

在这个例子中你可以使用`group`和`coerceTo`命令来实现扭转操作

```js
r.db('test').table('marks').group('name').map(function (row) {
    return [row('course'), row('mark')];
}).ungroup().map(function (res) {
    return r.expr({name: res('group')}).merge(res('reduction').coerceTo('object'));
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

_Note:_ A nicer syntax will eventually be added. See the
[Github issue 838](https://github.com/rethinkdb/rethinkdb/issues/838) to track
progress.


## 字段转记录操作(Performing an unpivot operation) ##

可以通过 `concatMap`, `map` 和 `keys` 命令来对`pivot(记录转字段操作)`进行反向操作

```js
r.table("pivotedMarks").concatMap(function (doc) {
    return doc.without("id", "name").keys().map(function (course) {
        return {
            name: doc("name"),
            course: course,
            mark: doc(course)
        };
    });
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

_Note:_ A nicer syntax will eventually be added. See the
[Github issue 838](https://github.com/rethinkdb/rethinkdb/issues/838) to track
progress.


## 重命名字段 ##

假设我们想把`users`表中的`id`字段改名成`idUser`字段. 在子查询中我们可以使用`merge`来添加一个字段同时不删除旧字段:

```js
r.table("users").map(
    r.row.merge({ idUser: r.row("id") }).without("id")
).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

## 基于日期或者时间的分组查询 ##

ReQL可以提取日期类型中年, 月, 日等...您可以用过这些时间单位来分组数据. 假设您有一个`invoices`表您希望通过年, 月对这些账单进行分组

```js
r.table("invoices")
    .group([r.row("date").year(), r.row("date").month()])
    .ungroup()
    .merge({invoices: r.row('reduction'), month: r.row('group')})
    .without('reduction', 'group')
    .orderBy('month')
.run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

如果您愿意您还能使用字段重命名来对返回的结果字段进行重命名.

目前ReQL支持数组最多元素为100,000个`group`命令会使用数组来进行分组. 所以您需要分组的记录不能超过100,000个.
话说回来其实也有办法可以改, 在RethinkDB启动命令参数中加一个`arrayLimit`参数就能设定数组上限了.

您还能通过对需要分组的字段[建立索引](/docs/2-2)来达到高效分组的目的.

```js
r.table('invoices').indexCreate(
    'byDay', [r.row('date').year(), r.row('date').month(), r.row('date').day()]
).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

基于索引分组数组并返回账单价格最高的一天:

```js
r.table("invoices")
    .group({index: 'byDay'})
    .max('price')
.run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

# 其他

## 使用自增数值作为主键 ##

在分布式系统中使用自增值作为主键而不能重复的确是一个不小的挑战. 
目前如果插入的记录缺少主键RethinkDB会随机一个UUID作为主键来使用.
目前自增主键功能还在我们的待开发功能中您可以通过[https://github.com/rethinkdb/rethinkdb/issues/117](https://github.com/rethinkdb/rethinkdb/issues/117)来查看进度.
如果您必须要用自增主键咋办? 那么我可以告诉你 ~~无可奉告~~ 使用开源库来解决.


## Parsing RethinkDB's response to a write query ##

__不做翻译您可以查看[10分钟快速了解](/docs/2-0)来了解这段是讲啥的__

When you issue a write query (`insert`, `delete`, `update`, or
`replace`), RethinkDB returns a summary object that looks like this:

```javascript
{deleted:0, replaced:0, unchanged:0, errors:0, skipped:0, inserted:1}
```

The most important field of this object is `errors`.  Generally
speaking, if no exceptions are thrown and `errors` is 0 then the write
did what it was supposed to.  (RethinkDB throws an exception when it
isn't even able to access the table; it sets the `errors` field if it
can access the table but an error occurs during the write.  This
convention exists so that batched writes don't abort halfway through
when they encounter an error.)

The following fields are always present in this object:

* `inserted` -- Number of new documents added to the database.
* `deleted` -- Number of documents deleted from the database.
* `replaced` -- Number of documents that were modified.
* `unchanged` -- Number of documents that would have been modified, except that the new value was the same as the old value.
* `skipped` -- Number of documents that were unmodified in a write operation, because the document is not available to be deleted or updated. The document might have been deleted by a different operation happening concurrently, or in the case of a `get` operation the key might not exist.
* `errors` -- Number of documents that were left unmodified due to an error.

In addition, the following two fields are set as circumstances dictate:

* `generated_keys` -- If you issue an insert query where some or all of the rows lack primary keys, the server will generate primary keys for you and return an array of those keys in this field.  (The order of this array will match the order of the rows in your insert query.)
* `first_error` -- If `errors` is positive, the text of the first error message encountered will be in this field.  This is a very useful debugging aid.  (We don't return all of the errors because a single typo can result in millions of errors when operating on a large database.)

## ReQL 命令中使用动态字段 ##

有时候您可能会使用动态字段来插入记录比如将字段名放在变量内. 这时您可以使用`object`命令来做到这点. `object`会接受(key, value, key, value...)格式并返回对象.

```js
r.table('users').get(1).update(r.object(propertyName, value)).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

字段名也可以写死, 列如将一个记录的值更新为新值

```js
r.table('users').forEach(function (doc) {
  return r.table('users').get(doc('id')).update(r.object(doc('field'), newValue));
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```

有个更实际的例子来展示. 假设记录存储着每位学生每门课的成绩.

```js
[
    {
        "name": "John",
        "mark": 70,
        "id": 1,
        "course": "Mathematics"
    },
    {
        "name": "John",
        "mark": 90,
        "id": 2,
        "course": "English"
    }
]
```

但是上述记录显示的不是很好看, 我是一个有追求的人想要下面这样的格式:

```js
{
    "Mathematics": 70,
    "English": 90
}
```

你可以用`object`和`pivot`来实现

```js
r.table("marks").filter({student: "John"}).map(function(mark) {
    return r.object(mark("course"), mark("mark"));
}).reduce(function(left, right) {
    return left.merge(right);
}).run(conn, function(err, result) {
    if (err) throw err;
    console.log(result);
});
```


## 将ReQL查询转换为字符串 ##

假设您在调试或者需要记录日志，但是NoSQL并不像传统SQL一样. 不过您可以在命令结尾使用.toString()将命令转换为字符串.

```js
r.table('users').filter(r.row('groups').contains('operators')).toString()
```

## 多行ReQL查询 ##

在一些查询接口中,通过实例化查询对象, 通过多次连续调用它来添加查询命令, 然后调用执行命令, 以编程方式“构建”查询是一种常见的模式.
这允许您根据运行时的条件动态更改查询. 你可能希望在ReQL中这样做

```js
var query = r.table('posts');
if (request.filter !== undefined) {
    query.filter(request.filter);
}
query.orderBy('date');
query.run(conn, callback);
```

然而这样返回的结果可能不会如您的预期. 因为ReQL查询状态是不会被保存的. 您可以通过每次调用命令并赋给一个变量来解决这个问题:

```js
var query = r.table('posts');
if (request.filter !== undefined) {
    query = query.filter(request.filter);
}
query = query.orderBy('date');
query.run(conn, callback);
```

## 多个 Feed 合并为一个 ##

您可能希望订阅多个表的更新时间很高兴ReQL可以那么干, 您可以使用`union`与`changes`配合工作来订阅两个表的事件:

```js
r.table('table1').union(r.table('table2')).changes().run(conn, callback);
```

您又可能需要知道事件被触发的时候是那个表触发了事件，您可以这样来标记表这样就知道是那个表触发的事件了:

```js
r.table('table1').merge({table: 'table1'})
 .union(r.table('table2').merge({table: 'table2'})
 .changes().run(conn, callback);
```

另外, 你可以对每个查询订阅事件, 而不是整个查询:

```js
r.table('table1').filter({flag: 'blue'}).changes()
 .union(r.table('table2').filter({flag: 'red'}).changes())
 .run(conn, callback);
```
