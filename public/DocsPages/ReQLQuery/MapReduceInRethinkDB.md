# RethinkDB中的Map-reduce
[Map-reduce](https://zh.wikipedia.org/wiki/MapReduce)是一种以高效的方式对可能存储在许多服务器上的大型数据集汇总和运行聚合函数的方法。
 它通过并行处理每个服务器上的数据, 然后将这些结果合并成一个集合来工作。 
 它最初由Google设计, 后来在数据库系统如[Hadoop](http://hadoop.apache.org/)和[MongoDB](http://www.mongodb.org/)中实现。

 <p>
    <img src="/DocsPages/images/map-reduce.png" class="api_command_illustration">
</p>

RethinkDB中完成Map-reduce操作通常有两或三步:
* __group__: 将元素分成多个组(可选).
* __map__: 在组内再将元素过滤细分并放入新组.
* __reduce__: 将__map__细分的组内值聚合为单个值.

一些map-reduce的实现, 例如 Hadoop, 会在mapping阶段分组数据; RethinkDB的实现和这些妖艳贱货们不一样. 
这些操作被称为"group-map-reduce"或者GMR.
RethinkDB可以使用GMR来将查询分散在格分片上进行查询处理.
您可以通过a`group`, `map`与`reduce`命令来完成GMR查询, 也许您在文档内看到了很多又臭又长的ReQL语句, 不过常见的操作一般只要1, 2行ReQL就能完成.

## 简单示例
假设您有一个正在运行的博客, 并且您想获取这个博客内全部的文章数量. 那么使用map-reduce来完成查询会有以下步骤:
* __map__: 将每个文章转换为数字`1`.
* __reduce__: 将每个文章的数字累加.
> 这个示例不需要`group`步骤

Blog数据库包含一个`posts`表其内部包含博客的全部文章. 下面将展示`posts`表内的一条记录作为示例:

```json
{
    "id": "7644aaf2-9928-4231-aa68-4e65e31bf219",
    "title": "The line must be drawn here",
    "content": "This far, no further! ...",
    "category": "Fiction"
}
```

首先我们执行`map`步骤, 将每个文章转换为`1`:

```javascript
r.db("blog").table("posts").map(function(post) {
	return 1;
})
```

然后我们执行`reduce`步骤, 将刚刚的`map`结果累加:

```javascript
r.db("blog").table("posts").map(function(post) {
	return 1
}).reduce(function(a, b) {
  return a.add(b);
})
```

在更多情况下您可以使用`map-reduce`来进行查询, 不过ReQL内提供了更简单的聚合函数. 
对于这个示例来说我们也可以使用`count`来达到同样的效果:

```javascript
r.db("blog").table("posts").count().run(conn)
```

RethinkDB目前有5个常用的聚合函数: `count`, `sum`, `avg`, `min`和`max`.
在实际操作中您可以使用上述5个聚合函数来代替`map`与`reduce`操作.

## __group__操作示例
还是上一个示例的Blog数据库, 不过这次我想找出来每个分类(`category`字段)中文章有多少个, 那么使用map-reduce来完成查询会有以下步骤:
* __group__: 基于文章分类进行分组.
* __map__ 将每个分组内转换为数字`1`.
* __reduce__: 将每个分组数字累加.

首先对posts表进行`group`操作

```javascript
r.db("blog").table("posts").group("category")
```

`group`操作会对相同文章分类的文章分为一个组, 接下来就和刚刚一样把分组内的全部元素转为数字`1`:

```javascript
r.db("blog").table("posts").group("category").map(function(post) {
	return 1;
})
```

接着我们使用`reduce`操作来把各分组的元素累加, 这样就能获得每个分类的总文章数量了:

```javascript
r.db("blog").table("posts").group("category").map(function(post) {
	return 1
}).reduce(function(a, b) {
  return a.add(b);
})
```

当然我们也可以使用`group`分组函数和`count`函数来简化上述操作:
```javascript
r.table("posts").group("category").count().run(conn)
```

## 复杂示例
这个示例是[来自MongoDB的示例](https://docs.mongodb.com/manual/tutorial/map-reduce-examples/).
想象下有个订单`orders`表, 里面每个记录结构是这样:

```json
{
    "customer_id":  "cs11072",
    "date": r.time(2014, 27, 2, 12, 13, 09, '-07:00'),
    "id": 103,
    "items": [
        {
            "price": 91,
            "quantity": 1,
            "item_id":  "sku10491"
        } ,
        {
            "price": 9,
            "quantity": 3,
            "item_id":  "sku14667"
        } ,
        {
            "price": 37 ,
            "quantity": 3,
            "item_id":  "sku16857"
        }
    ],
    "total": 229
}
```

首先我们返回每个客户全部订单价格总计. 由于每个订单的总价已经计算过并存放在`total`字段所以我们可以直接来使用聚合函数来查询:

```javascript
r.table("orders").group("customer_id").sum("total")
```

不过有个更复杂的需求来了: 我们需要计算订单内商品的每个平均数量以及总共数量.
对于这个需求我们可以使用[concat_map](https://www.rethinkdb.com/api/python/concat_map)函数并配合`map`操作来完成.
首先我们想要拿出全部订单中商品以及商品ID, 并且我们会增加一个`count`字段并标其值为`1`, 然后和在博客示例中一样使用`map`来遍历全部订单商品:

```javascript
r.table("orders").concatMap(function(order){
  return order("items").map(function(item){
    return {
      "item_id": item("item_id"),
      "quantity": item("quantity"),
      "count": 1
    }
  })
})
```

`map`函数是用来遍历每个订单的全部商品并返回一个列表, 列表内包含3个字段: `item_id`, `quantity`和`count`.

现在我们对`item_id`字段进行`group`操作, 再使用`reduce`来累加商品数量以及记录商品项总数:

```javascript
r.table("orders").concatMap(function(order){
  return order("items").map(function(item){
    return {
      "item_id": item("item_id"),
      "quantity": item("quantity"),
      "count": 1
    }
  })
}).group("item_id").reduce(function(left, right) {
  return {
    "item_id": left("item_id"),
    "quantity": left("quantity").add(right("quantity")),
    "count": left("count").add(right("count"))
  }
})
```

最后我们使用[ungroup](https://www.rethinkdb.com/api/python/ungroup/)来将已经分组的数据放进对象数组中.
`group`字段将会是每个分组的ID; `reduction`字段内将会有来自`concat_map`处理后的每个组的数据.
然后我们再次使用`map`遍历数组来计算平均值.

```javascript
r.table("orders").concatMap(function(order){
  return order("items").map(function(item){
    return {
      "item_id": item("item_id"),
      "quantity": item("quantity"),
      "count": 1
    }
  })
}).group("item_id").reduce(function(left, right) {
  return {
    "item_id": left("item_id"),
		"quantity": left("quantity").add(right("quantity")),
		"count": left("count").add(right("count"))
  }
}).ungroup().map(function(group) {
   return {
    "item_id": group("group"),
		"quantity": group("reduction")("quantity"),
		"avg": group("reduction")("quantity").div(group("reduction")("count"))
  }
})
```

处理后的结果如下:

```json
[
    {
        "avg": 3.3333333333333,
        "quantity": 20,
        "item_id": "sku10023"
    },
    {
        "avg": 2.2142857142857,
        "quantity": 31,
        "item_id": "sku10042"
    },
    ...
]
```

## GMR如何执行查询的

RethinkDB的GMR查询会尽可能的使用多个分片与多个CPU核心来达到并行化目的.
这样可以将查询速度大幅度提升, it’s important to keep in mind that the `reduce` function is `not` called on the elements of its input stream from left to right. It’s called on either the elements of the stream ___in any order___ or on the output of previous calls to the function.

这里有个使用map-reduce错误方法简单示例:

```js
/* 错误方法! */
r.table("posts").group(function(post) {
    return post("category");
}).map(function(item) {
  return 1;
}).reduce(function(left, right) {
  return left.add(1)
});

/* 正确方法! */
r.table("posts").group(function(post) {
    return post("category");
}).map(function(item) {
  return 1;
}).reduce(function(left, right) {
  return left.add(right)
});
```

假设我们有个表, 表的分片数为2个. 表中有一个`category`字段. 表中有10个记录的`category`都是一样的. 其中4个记录在表分片1中, 还有6个在表分片2中. 当使用错误的查询姿势时其查询流程是这样的:

当在表分片1统计完记录数量时会返回`4`

当在表分片2统计完记录数量时会返回`6`

最后一个步骤还是计算总和的, 不过计算的不是`4 + 6`而是`4 + 1`. 这样就导致了这个查询结果是错误的.

## 了解更多
如您想了解更多关于map-reduce, 可以访问[map-reduce维基百科介绍](http://en.wikipedia.org/wiki/MapReduce).