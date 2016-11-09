# RethinkDB中的模型关系
有两种方式可以在RethinkDB中建立模型之间关系
* 内嵌数组方式
* 将记录存储在多个表里(就和普通的关系型数据库一样)
我们回来说明两种方式的优缺点，并会以一个blog数据库存储一些作者与文章来作为说明.
<p>
    <img src="/DocsPages/images/data-modeling.png" class="api_command_illustration">
</p>

## 使用内嵌数组
我们可以使用内嵌数组的方式将作者-文章作为模型关系. 如下为`authors`表使用内嵌数组记录:
```
{
  "id": "7644aaf2-9928-4231-aa68-4e65e31bf219",
  "name": "William Adama", "tv_show": "Battlestar Galactica",
  "posts": [
    {"title": "Decommissioning speech", "content": "The Cylon War is long over..."},
    {"title": "We are at war", "content": "Moments ago, this ship received..."},
    {"title": "The new Earth", "content": "The discoveries of the past few days..."}
  ]
}
```
`authors`表中每条记录都是作者信息，同时信息内包含了`posts`数组标识该作者所写的文章。
当使用这样方式时候如果你需要知道作者写了那些文章查询起来会非常方便:
```
# 查询全部作者以及作者的文章
r.db("blog").table("authors").run()

# 查询单个作者以以及他的文章
r.db("blog").table("authors").get(AUTHOR_ID).run()
```
> 内嵌数组优点:
> * 查询作者与作者的文章方便
> * 数据一般会在硬盘上，对比表连接来说当查询内嵌数组时会顺序将数据全部读入
> * 更新记录信息都会原子更新

> 内嵌数组缺点:
> * 删除，添加，更新任何文章都需要载入全部`posts`数组，然后整个重新写回硬盘
> * 由于第一个缺点，所以`posts`数组内部元素最好小余100个

## 多个表链接记录
您可以使用表关系来建立两个表存储数据. 如下为`authors`表使用表连接数据
```
{
  "id": "7644aaf2-9928-4231-aa68-4e65e31bf219",
  "name": "William Adama",
  "tv_show": "Battlestar Galactica"
}
```
`posts`表记录
```
{
  "id": "064058b6-cea9-4117-b92d-c911027a725a",
  "author_id": "7644aaf2-9928-4231-aa68-4e65e31bf219",
  "title": "Decommissioning speech",
  "content": "The Cylon War is long over..."
}
```
每个文章中都包含了`author_id`字段，这样就能知道是那个作者写的了. 我们将查询特定作者的全部文章:
```
# 如果您为`author_id`建立了索引
r.db("blog").table("posts").
  get_all("7644aaf2-9928-4231-aa68-4e65e31bf219", index="author_id").
  run()

# 如果您没有为`author_id`建立了索引
r.db("blog").table("posts").
  filter({"author_id": "7644aaf2-9928-4231-aa68-4e65e31bf219"}).
  run()
```
如果我们想获取特定作者的信息外加作者所写的文章那么在关系型数据库中我们使用`JOIN`, RethinkDB中我们使用`eq_join`命令:
```
# 为了使这个查询可以正常使用，我们需要 `posts`.`author_id`有一个索引
r.db("blog").table("authors").get_all("7644aaf2-9928-4231-aa68-4e65e31bf219").eq_join(
    'id',
    r.db("blog").table("posts"),
    index='author_id'
).zip().run()
```
在这需要注意的是作者的`id`与文章的`author_id`是对应的，这样就可以让记录连接起来了。

> 多表连接的优点
> * 操作作者或文章记录时不需要把全部文章都加载进内存
> * 这种方式没有文章记录上限，适用于需要大量的连接记录

> 多表连接的缺点
> * 会使查询更加复杂
> * 无法原子性的更新记录

## 了解更多
有一篇单独文章来说明[RethinkDB表连接](/docs/2-4)其中有关于表的多种连接办法。
如果您不确定该使用那种连接可以在[Stack Overflow](http://stackoverflow.com/questions/ask)上提问或者在[Freenode](http://www.freenode.org/)加入`#rethinkdb`IRC频道.



