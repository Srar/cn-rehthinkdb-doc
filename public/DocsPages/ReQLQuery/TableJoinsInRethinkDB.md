# RethinkDB中的表连接

与大多数传统数据库一样，RethinkDB支持`JOIN`命令来连接多个表使数据结合，
在RethinkDB集群中表连接指令会自动发送至集群的对应节点，并自动完成数据组合返回给用户。

现在我们来看看如何在RethinkDB中使用 ___一对多表___ 和 ___多表对多表___ 查询。

## 一对多表

### 使用主键

假设我们现在已经有两张表`employees`, `companies`, 我们用这两张表来模拟职员和公司的情况(一职员会为一个公司工作，
一个公司有很多人在为其工作)。

下面记录是`employees`表的记录
```
{
    "id": "543ad9c8-1744-4001-bb5e-450b2565d02c",
    "name": "Jean-Luc Picard",
    "company_id": "064058b6-cea9-4117-b92d-c911027a725a",
    "rank": "captain"
}
```
这下面是`companies`表的记录
```
{
    "id": "064058b6-cea9-4117-b92d-c911027a725a",
    "company": "Starfleet",
    "type": "paramilitary"
}
```
我们可以这样连接两张表:
```
r.table("employees").eq_join("company_id", r.table("companies")).run()
```
这个查询是将`company_id`字段与`companies`的主键连接，并会返回职员和公司信息:
```
{
    "left": {
        "id": "543ad9c8-1744-4001-bb5e-450b2565d02c",
        "name": "Jean-Luc Picard",
        "company_id": "064058b6-cea9-4117-b92d-c911027a725a",
        "rank": "captain"
    },
    "right": {
        "id": "064058b6-cea9-4117-b92d-c911027a725a",
        "company": "Starfleet",
        "type": "paramilitary"
    }
}
```
* `left`字段表示从左表查询的信息(在这例子中表示的是职员)
* `right`字段表示从右表查询的信息(在这例子中表示的是公司)

我们可以在查询末尾使用`zip`命令来将两个字段合并为一条记录:
```
r.table("employees").eq_join("company_id", r.table("companies")).zip().run()
```
结果
```
{
    "id": "064058b6-cea9-4117-b92d-c911027a725a",
    "name": "Jean-Luc Picard",
    "company_id": "064058b6-cea9-4117-b92d-c911027a725a",
    "rank": "captain",
    "company": "Starfleet",
    "type": "paramilitary"
}
```

### 使用子查询

一个常见的数据查询任务：查询一个记录相关联的子记录。在我们的例子中，
我们想获取公司以及公司全部职员信息，我们可以使用`merge`命令并在lambda中使用子查询。
```
id = "064058b6-cea9-4117-b92d-c911027a725a"
r.table("companies").get(id).merge(lambda company:
    { 'employees': r.table('employees').get_all(company['id'],
                           index='company_id').coerce_to('array') }
).run()
```
返回结果
```
{
    "id": "064058b6-cea9-4117-b92d-c911027a725a",
    "company": "Starfleet",
    "type": "paramilitary",
    "employees": [
        {
            "id": "543ad9c8-1744-4001-bb5e-450b2565d02c",
            "name": "Jean-Luc Picard",
            "company_id": "064058b6-cea9-4117-b92d-c911027a725a",
            "rank": "captain"
        },
        ...
    ]
}
```
使用`eq_join`的情况下返回的结果会像传统SQL数据库中`SELECT * FROM companies, employees WHERE companies.id = employees.company_id`
当使用子查询会生成一个嵌套字段，其中员工对象会在`employees`字段中返回。

### 使用索引
假设我们员工信息内的公司存储的是公司名而不是公司ID
```
{
    "id": "543ad9c8-1744-4001-bb5e-450b2565d02c",
    "name": "Jean-Luc Picard",
    "company_name": "Starfleet",
    "rank": "captain"
}
```
我们在`companies`表中使用`company`字段来创建索引，并通过索引来查询公司:
```
r.table("companies").index_create("company").run()
```
查询如下:
```
r.table("employees").eq_join("company_name",
                             r.table("companies"), index="company").run()
```
<div class="infobox ">
    Want to learn more about indexes?: Read about using secondary indexes in RethinkDB.
</div>

<div class="infobox ">
    <b>Note</b>: you can also join tables on arbitrary fields without creating an index using the inner_join command. However, arbitrary inner joins are less efficient then equijoins.
</div>


## 多表对多表

您可以使用RethinkDB来进行的多表对多表查询，先让我们假设我们有一个协作博客平台(作者可以编辑不属于自己的特定文章，同样也可以发布文章)

为了存储这样的数据我们需要建立三个表`authors`, `posts`, `authors_posts`类似与在关系性数据库中做的东西。
下面显示的是`authors`表中举例数据：
```
{
  "id": "7644aaf2-9928-4231-aa68-4e65e31bf219",
  "name": "William Adama",
  "tv_show": "Battlestar Galactica"
}
{
  "id": "064058b6-cea9-4117-b92d-c911027a725a",
  "name": "Laura Roslin",
  "tv_show": "Battlestar Galactica"
}
```
`posts`表中举例数据：
```
{
    "id": "543ad9c8-1744-4001-bb5e-450b2565d02c",
    "title": "Decommissioning speech",
    "content": "The Cylon War is long over..."
}
```
`authors_posts`表中举例数据：
```
{
    "author_id": "7644aaf2-9928-4231-aa68-4e65e31bf219",
    "post_id": "543ad9c8-1744-4001-bb5e-450b2565d02c"
}
{
    "author_id": "064058b6-cea9-4117-b92d-c911027a725a",
    "post_id": "543ad9c8-1744-4001-bb5e-450b2565d02c"
}
```
在多对多表查询中，我们可以使用多个`eq_join`命令来连接3个表：
```
r.table("authors_posts").eq_join("author_id", r.table("authors")).zip().
  eq_join("post_id", r.table("posts")).zip().run()
```
查询出来的结果是stream stream中包含了每个作者写的每个文章:
```
{
    "tv_show": "Battlestar Galactica",
    "title": "Decommissioning speech",
    "post_id": "543ad9c8-1744-4001-bb5e-450b2565d02c",
    "name": "William Adama",
    "id": "543ad9c8-1744-4001-bb5e-450b2565d02c",
    "content": "The Cylon War is long over...",
    "author_id": "7644aaf2-9928-4231-aa68-4e65e31bf219"
}
{
    "tv_show": "Battlestar Galactica",
    "title": "Decommissioning speech",
    "post_id": "543ad9c8-1744-4001-bb5e-450b2565d02c",
    "name": "Laura Roslin",
    "id": "543ad9c8-1744-4001-bb5e-450b2565d02c",
    "content": "The Cylon War is long over...",
    "author_id": "064058b6-cea9-4117-b92d-c911027a725a"
}
```

## 解决字段冲突

如果你在`join`之后使用了`zip`命令，那么右表数据会被合并到左表。

如果你执行下面查询
```
r.table("employees").eq_join("company_id", r.table("companies"))
```
返回结果应该是这样
```
{
    # Employee
    "left": {
        "id": "543ad9c8-1744-4001-bb5e-450b2565d02c",
        "name": "Jean-Luc Picard",
        "company_id": "064058b6-cea9-4117-b92d-c911027a725a",
        "rank": "captain"
    },
    # Company
    "right": {
        "id": "064058b6-cea9-4117-b92d-c911027a725a",
        "company": "Starfleet",
        "type": "paramilitary"
    }
}
```
这时候如果使用`zip`合并记录冲突字段就是`id`，你可以选择移除右表或左表`id`字段来完成查询
```
r.table("employees").eq_join("company_id", r.table("companies"))
    .without({"right": {"id": True}}) # 移除右表`id`字段
    .zip()
    .run()
```

## 字段重命名

如果你想同时保留上面两个字段，你可以将一个字段使用`map`和`without`在`zip`命令前执行字段重命名:
```
r.table("employees").eq_join("company_id", r.table("companies"))
    # 复制右表`id`粘贴成右表`c_id`字段
    .map( r.row.merge({
        "right": {
            "c_id": r.row["right"]["id"]
        }
    }))
    # 删除右表`id`字段
    .without({"right": {"id": True}})
    .zip()
    .run()
```

## 手动合并左右表字段
你可以在没有使用`zip`命令情况下手动合并左右表字段，举个例子你想保留职员名字和公司名字，就可以这样肛
```
r.table("employees").eq_join("company_id", r.table("companies"))
    .map({
        "name": r.row["left"]["name"],
        "company": r.row["right"]["company"]
    }).run()
```

## 了解更多

To learn more, read about data modeling in RethinkDB. For detailed information, take a look at the API documentation for the join commands:

* eq_join
* inner_join
* outer_join
* zip