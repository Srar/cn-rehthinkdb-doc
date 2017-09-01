# ReQL中的数据类型
RethinkDB基本数据类型包括 numbers, string, boolean, objects, arrays和null. 

RethinkDB特有的数据类型(RethinkDB-specific data types)包括: tables, streams, selections, 二进制对象, 时间对象, 几何数据, 组数据(grouped data). 

`typeOf`命令可以追加在ReQL任何命令后. 该命令将会返回类型名:
```
r.table('users').get(1).typeOf().run(conn, callback)
```
结果会返回`"SELECTION<OBJECT>"`

## 基本数据类型
* ___Numbers___ 可以是任何数值列如:5, 3.14159, -42. 在RethinkDB numbers会以double(64位)类型进行存储
* ___Strings___ 可以是任何UTF-8字符串列如: `"superhero"`, `"ünnëcëssärÿ ümläüts"`. 包含也可以包含unicode(\u0000 不会影响字符串结束判断)
* ___Booleans___ 值仅可以是`true`和`false`
* ___Null___    是一个不同于数字0, 空集或零长度字符串的值。根据编程语言不同可能是`null`, `nil`或者`None`。它表示没有任何其他值。树的根节点也有可能是`null`, 或者未初始化的key也是`null`
* ___Objects___ 是JSON的对象, 由key-value组成
```js
{
    "username":"bob",
    "posts":23,
    "favorites":{
        "color":"blue",
        "food":"tacos"
    },
    "friends":[
        "agatha",
        "jason"
    ]
}
```

任意有效的JSON对象就是有效RethinkDB的对象, 所以如同JSON一样键必须是字符串, 值可以是基本数据类型, 数组, 或其他JSON有效类型
* ___Arrays___ 是一个列表里面放着0个或多个元素<br/>
`[]`,`[1, 2, 3]`,`[{user: 'Bob', posts: 23}, {user: 'Jason', posts: 10}]`<br/>
同样, 有效的JSON数组在RethinkDB也是有效的数组, 值必须是基本数据类型数组数组。RethinkDB返回数组给用户前会将数组全部加载进内存, 所以请避免返回元素过多的数组。
RethinkDB默认情况下支持数组内包含10万个元素, 如果你想修改此限制可以在启动RethinkDB时参数指定`array_limit`参数.

## RethinkDB特有类型
* ___Databases___ 是 RethinkDB 数据库类型. 调用`typeof`时会返回`db`.
* ___Tables___ 是 RethinkDB数据库表. 您可以通过它来增加, 删除, 修改, 查询里面记录.当仅是`tables`时ReQL查询才会使用命令列如: `getAll`.
* ___Streams___ 像一个数组, 但是它会慢慢把数据加载。当返回流时会返回一个游标, 游标会像指针一样指向结果。让你读取大量结果时不会一下子读取全部内容, 而是像遍历数组一样, 慢慢的取回下一行数据、
流是只读的你不能拿来输入其他ReQL命令列如`delete`, `delete`.
* ___Selections___ 类似表的子集举个例子当使用`filter`或`get`时会返回这个类型. 其中有三种Selection类型
___Selection&lt;objects&gt;___, ___Selection&lt;Array&gt;___和___Selection&lt;Stream&gt;___.
Selections与non-Selection区别是Selections是可以写的可以传递给别的ReQL命令来修改这个结果.举个例子: 当使用`get`命令时会返回`Selection<Object>`这时候你可以调用`update`或`delete`来进行下一步操作。
有一些命令(`orderBy`和`between`)会返回类似`Selection`的`table_slice`类型. 
一般情况下`table_slice`和`Selection`作用相同但当使用`between`时`between`只会接受`table`或者`table_slice`类型。
* ___Pseudotypes___ 其他情况下的RethinkDB数据类型
    * ___Binary objects___像SQL数据库中的BLOB, 你可以来存放图片, 文件或其他二进制数据. 
    [这里](https://www.rethinkdb.com/docs/storing-binary/javascript/)这里了解如何存储二进制数据。
    * ___Times___是RethinkDB原生的时间类型, 它可以精确到毫秒。在应用程序中使用时间会由RethinkDB库来完成转换。
    * ___Geometry data types___是用来支持地理位置数据, 包括点, 线和多边形数据。
    * ___Grouped data___是`group`命令返回的类型. 
    它会基于字段或者函数把Stream分成多个组.当ReQL命令操作`GROUPED_DATA`数据时会单独操作每个组.需要了解更多关于[group](https://www.rethinkdb.com/api/javascript/group)请查询文档。

## 抽象数据类型
当您在阅读文档时候或者处理错误消息时候可能会遇到一些数据类型的术语( you’ll come across terms for “data types” that are actually classes of other data types.).
* ___datum___ 包括：全部基本数据类型, 伪类型, 对象以及non-stream selections.不包括Stream, Selection<Stream>, databases, tables, table分片和function.
* ___Sequence___ 任何list类型: arrays, streams, selections和tables.
* ___Minval___和___maxval___ 将会配合某些命令使用, 假设`between`来设置上限(`between(r.minval, 1000)`返回主键小余1000的记录).
* ___Functions___ 可以在某些ReQL命令中当成参数传递.

## 排序

Arrays与字符串将会按照字典顺序来排序, 对象会在排序前转换为arrays.字符串当是unicode时候将无法被排序.

混合字段与混合数据将会已下面顺序进行排序:
* arrays
* booleans
* null
* numbers
* objects
* binary objects
* geometry objects
* times
* strings

这些顺序是由类型名字(`typeOf()`命令获取)排序决定的.

您可以在Web管理界面 - Data Explorer中运行下面查询来直观了解混合数据排序:

```js
r.expr([
    {val: 1},
    {val: 2},
    {val: null},
    {val: 'foo'},
    {val: 'bar'},
    {val: [1, 2, 4]},
    {val: [1, 2, 3]},
    {val: true},
    {val: r.now()},
    {val: {foo: 100}},
    {val: {bar: 200}}
]).orderBy('val')
```
返回:
```js
[
    {"val":[1,2,3]},
    {"val":[1,2,4]},
    {"val":true},
    {"val":null},
    {"val":1},
    {"val":2},
    {"val":{"bar":200}},
    {"val":{"foo":100}},
    {"val":{"$reql_type$":"TIME"}},
    {"val":"bar"},
    {"val":"foo"}
]
```

## 几何数据类型

如果想了解很多关于这个类型, read about RethinkDB’s geospatial support.

* ___Points___ 由坐标(double型经度和纬度)表示的单个点.
* ___Lines___  由2个或2个以上的坐标, ___points___对象组成的类型.
* ___Polygons___ 由3个或者3个以上的坐标, ___points___对象组成的类型,
___points___对象或坐标应不会相交与自己, 第一个点与最后一个点的坐标应该是一样的.
如果你想创建一个没有闭合的多边形, 可以使用`polygonSub`命令来创建(目前只有这个命令可以创建没闭合的多边形).

在RethinkDB API文档中您还会看到___pseudotype___, 它代表了全部几何数据类型.

## Streams
Stream会使用延迟加载, 当查询后返回结果集时不会返回结果集。而是由流返回一个迭代器简称为[`游标`](http://en.wikipedia.org/wiki/Iterator), `游标`会想指针一样指向数据集.

不同编程语言中使用迭代器的方式各有不同, 但是基本概念是相同的：在结果集中遍历, 每次只会返回一个结果。在Python中你会使用遍历Steam:

```python
players = r.table('players').run(conn)
for player in players:
	print player
```

Ruby中您可以使用block:

```ruby
players = r.table('players').run(conn)
players.each do |player|
	puts player
end
```

JavaScript中没有原生的游标, 但是ReQL提供了[each](https://www.rethinkdb.com/api/javascript/each)命令, 就像在[jQuery](http://api.jquery.com/each/)中一样：

```js
r.table('players').run(conn, function(err, cursor) {
	cursor.each(function(err, player) {
		if (err) throw err;
		console.log(player);
	});
});
```

当返回的结果集比较小时可以直接使用`toArray()`来获取整个结果集.