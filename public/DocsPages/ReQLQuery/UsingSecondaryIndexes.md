# RethinkDB中使用索引

索引可以大幅度提高查询数据速度，但是付出的代价仅仅只会增加一点存储空间。

RethinkDB支持已下数据结构的索引:

* 基于单个字段的值的___单键索引___
* 基于多个字段的值的___复合索引___
* 基于数组的___多键索引___
* 基于表达式的索引

<p>
    <img src="/DocsPages/images/secondary-indexes.png" class="api_command_illustration">
</p>

## 单键索引

使用单键索引可以高效的查询数据或根据数据进行排序

___创建___

```
// 基于`last_name`字段创建一个单键索引
r.table("users").indexCreate("last_name").run(conn, callback)
```

```
// 等待索引添加完毕
r.table("users").indexWait("last_name").run(conn, callback)
```

___查询___

```
// 获取姓为"Smith"的全部用户
r.table("users").getAll("Smith", {index: "last_name"}).run(conn, callback)

// 获取last_name为"Smith"或"Lewis"的全部用户
r.table("users").getAll("Smith", "Lewis", {index: "last_name"}).run(conn, callback)

// 获取last_name"Smith"-"Wade"之间的全部用户
r.table("users").between("Smith", "Wade", {index: "last_name"}).run(conn, callback)

// 使用索引对last_name来排序
r.table("users").orderBy({index: "last_name"}).run(conn, callback)

// 遍历blog文章, 使用last_name来返回文章和文章作者
// (assume "author_full_name" is the name of a field in "posts")
r.table("posts").eqJoin("author_last_name", r.table("users"), {index: "last_name"}) \
    .zip().run(conn, callback)

```

<div class="infobox">
   Want to learn more about joins in RethinkDB? See how to use joins to query one to many and many to many relations.
</div>

## 复合索引

复合索引使用数组通过多个字段来查询数据。

___创建___

```
// 基于 last_name first_name 来创建复合索引
r.table("users").indexCreate(
    "full_name", [r.row("last_name"), r.row("first_name")]
).run(conn, callback)
```

```
//  等待索引添加完毕
r.table("users").indexWait("full_name").run(conn, callback)
```

___查询___

```
// 获取全名为『John Smith』的用户
r.table("users").getAll(["Smith", "John"], {index: "full_name"}).run(conn, callback)

// 获取全名从『"John Smith"』 - 『"Wade Welles"』的全部用户
r.table("users").between(
    ["Smith", "John"], ["Welles", "Wade"], {index: "full_name"}
).run(conn, callback)

// 获取姓为『Smith』的用户
r.table("users").between(
    ["Smith", r.minval], ["Smith", r.maxval], {index: "full_name"}
).run(conn, callback)

// 根据「姓」「名」索引来进行用户排序
r.table("users").orderBy({index: "full_name"}).run(conn, callback)

// 遍历blog文章, 使用全名来返回文章和文章作者
r.table("posts").eqJoin(
    "author_full_name", r.table("users"), {index: "full_name"}
).run(conn, callback)

```
RethinkDB内会把单键索引和复合索引视为同一个索引类型，复合索引仅仅使用的是数组，而不是单键类型单个值。

## 多键索引

使用简单索引和复合索引时，一个记录将使用一个索引或一组值用一个复合索引多个记录有可能会使用同一个索引. 
当使用多键索引时一条记录可以使用索引内多个键来查询.举个例子：一篇博客文章可能有多个标签，同时每个标签也对应着一些博客文章。
在多键索引中键值可以有一个，多个甚至是表达式。

___创建___

假设每个文章都有一个`tags`字段数组，那么表结构应该是这样的
```
{
    title: "...",
    content: "...",
    tags: [ <tag1>, <tag2>, ... ]
}
```

```
// 基于`tags`来创建多键索引 
r.table("posts").indexCreate("tags", {multi: true})

// 等待索引创建完毕
r.table("posts").indexWait("tags").run(conn, callback)
```

___查询___

```
// 获取`tags`数组中包含`travel`的全部文章
r.table("posts").getAll("travel", {index: "tags"}).run(conn, callback)

// 遍历全部`tags` 并返回文章中包含`tags`数组中值的文章
r.table("tags").eqJoin("tag", r.table("posts"), {index: "tags"}).run(conn, callback)
```
使用`getAll`和`between`可能会一条记录返回多次，如果想排除重复请[distinct](https://www.rethinkdb.com/api/javascript/distinct)

## ReQL表达式创建索引

您可以使用`indexCreate`传入匿名函数表达式来创建索引
```
// 不同创建复合索引的方式
r.table("users").indexCreate("full_name2", function(user) {
    return r.add(user("last_name"), "_", user("first_name"))
}).run(conn, callback)
```
匿名函数必须是返回结果是一样的(已确定)，所以你不能使用子查询和`r.js`
<div class="infobox ">
   如果匿名函数返回值错误，那么索引不会创建成功
</div>

## 多键索引与表达式使用

您也可以在表达式中创建多键索引
```
// 使用表达式创建多键索引
r.table("users").indexCreate("activities", r.row("hobbies").add(r.row("sports")),
    {multi: true}).run(conn, callback)
```

## Use a multi index and a mapping function to speed getAll/contains
If your program frequently executes a getAll followed by a contains, that operation can be made more efficient by creating a compound multi index using a mapping function on the field that contains the list.

```
// Create the index
r.table("users").indexCreate("userEquipment", function(user) {
    return user("equipment").map(function(equipment) {
        return [ user("id"), equipment ];
    });
}, {multi: true}).run(conn, callback);

// Query equivalent to:
// r.table("users").getAll(1).filter(function (user) {
//     return user("equipment").contains("tent");
// });
r.table("users").getAll([1, "tent"], {index: "userEquipment"}).distinct().run(conn, callback);
```

## 索引管理
```
// 查看"users"表的全部索引
r.table("users").indexList().run(conn, callback)

// 删除"users"的`last_name`索引
r.table("users").indexDrop("last_name").run(conn, callback)

// 返回"users"全部索引状态
r.table("users").indexStatus().run(conn, callback)

// 返回"users"表"last_name"索引状态
r.table("users").indexStatus("last_name").run(conn, callback)

// 当"last_name"准备完毕时回调
r.table("users").indexWait("last_name").run(conn, callback)
```

## 使用Web管理界面操作索引
Web管理界面支持创建，删除单键索引，你可以在`table`点击表列如`users`的`Secondary indexes`来管理索引

## 备注
主键可以在ReQL支持的任何索引命令里使用

如果写记录操作成功，才会更新索引。了解更多点这里[RethinkDB 一致性](https://www.rethinkdb.com/docs/consistency/)

The part of a secondary index key that’s used for fast lookups depends on the length of the primary key (which must be 127 bytes or less). The length of this part is 238−PK, where PK is the primary key length; if the primary key length is a 36-character GUID, for instance, this means that 202 characters in the secondary index will be significant. If a table has multiple entries where the first 238−PK characters are identical, lookup performance will be sharply degraded, as RethinkDB will have to perform a linear search to find the correct entries.

索引不会存储`null`或者对象(Secondary indexes will not store null values or objects. Thus, the results of a command such as:)
```
r.table("users").indexCreate("group").run(conn, callback)
r.table("users").orderBy({index: "group"}).run(conn, callback)
```
这样也不会用到索引(may be different from an equivalent command without an index:)
```
r.table("users").orderBy("group").run(conn, callback)
```
if the field being indexed has non-indexable values. This limitation will be removed in a future version of RethinkDB. See GitHub issue [#1032](https://github.com/rethinkdb/rethinkdb/issues/1032) to track progress on this.

RethinkDB目前还不会自动优化查询，下面这样就不会用到索引
```
// 没用索引
r.table("users").filter({"last_name": "Smith" }).run(conn, callback)

// 使用索引
r.table("users").getAll("Smith", {index: "last_name"}).run(conn, callback)
```
您不能同时使用多个`getAll`来进行查询。建议使用复合索引来代替使用

An orderBy command that uses a secondary index cannot be chained after getAll. You can only chain it after a table command. However, you can chain orderBy after a between command provided it uses the same index.

RethinkDB does not support unique secondary indexes even for non-sharded tables.

## 更多

点击下面连接了解关于更多的索引命令

* Manipulating indexes: indexCreate, indexDrop and indexList
* Using indexes: getAll, between, eqJoin and orderBy

