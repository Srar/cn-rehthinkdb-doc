# 了解ReQL

ReQL是RethinkDB的查询语言，它提供了非常强大和方便的方式来处理JSON数据.
这篇文档是正对ReQL的介绍

ReQL与其他NoSQL查询语言不同。 它建立在三个关键原则：

___ReQL嵌入到您的编程语言中___ 通过使用您已经知道的编程语言进行函数调用来构造查询。 您不必拼接字符串或构造专门的JSON对象来查询数据库。

___ReQL全部查询都可以使用链式调用___ 您可以从选择表开始到结束一直使用`.`来调用函数

___全部查询在RethinkDB实例执行___ 虽然查询是使用熟悉的编程语言在应用程序上构建的，但一旦调用`run`命令并将其传递给数据库连接，它们就会在RethinkDB实例上执行。

让我们更详细地看看这些概念。

<div class="infobox ">
   注意：以下示例使用Python，但大多数也适用于其他语言使用RethinkDB方式。
</div>

## ReQL嵌入您的编程语言
您在应用程序中开始使用ReQL的方式与使用其他数据库类似：
```
import rethinkdb as r  # 导入RethinkDB包
conn = r.connect()     # 使用localhost和默认端口连接
```
从这里开始类似的地方结束，不是拼接字符串然后将字符串传递至数据库. 而是直接使用RethinkDB包中的ReQL来操作RethinkDB
```
r.table_create('users').run(conn)   # 创建`users`表
r.table('users').run(conn)          # 获取可迭代的users表游标对象
```
每个ReQL查询，从`filters`，到`filters`，到表连接，都可以用过对应的方法来完成。

<div class="infobox ">
    这样设计具有以下优点：
    <ul>
        <li>您可以已经使用您已经习惯的编程环境和工具</li>
        <li>学习ReQL与学习任何其他库没有什么不同。</li>
        <li>拼接字符串引起安全问题也许根本就没有</li>
    </ul>
</div>


## ReQL查询全部可链式调用

在ReQL中您可以在命令结尾处使用`.`来继续使用别的命令

```
# 获取可迭代的users表游标对象
r.table('users').run(conn)

# 仅返回表的全部`last_name`字段
r.table('users').pluck('last_name').run(conn)

# 获取所有不同的姓(排除重复)
r.table('users').pluck('last_name').distinct().run(conn)

# 获取所有不同的姓的数量
r.table('users').pluck('last_name').distinct().count().run(conn)
```


几乎所有的ReQL操作都是可链式调用的。`.`就类似于Unix管道。从表中选择数据并将其转换为转换它的命令。 您可以继续链接命令，直到查询完成。 

即使您有一个RethinkDB节点集群，您可以发送查询到任何节点，集群将创建和执行分布式程序，从相关节点获取数据，执行必要的计算，并呈现给您最终结果，而不必关系内部实现。

<div class="infobox ">
    这样设计具有以下优点：
    <ul>
        <li>ReQL易于学习，阅读和修改。</li>
        <li>用自然的方式来表达查询。</li>
        <li>您可以通过组合变换和检查中间结果来递增地构造查询。</li>
    </ul>
</div>

## 高效的ReQL

___服务器端执行___

虽然查询是在应用程序内构建的，它们只有在调用`run`时才发送到RethinkDB实例。
之后全部的处理全部发生在RethinkDB实例, 在查询期间应用程序和RethinkDB实例没有任何通讯。
举个例子：您可以把查询存储在变量内，在需要的时候再发送给RethinkDB实例。

```
# 创建查询全部姓的变量
distinct_lastnames_query = r.table('users').pluck('last_name').distinct()

# 发送查询至RethinkDB实例并执行
distinct_lastnames_query.run(conn)
```

<div class="infobox ">
   Read about how this technology is implemented for more details.
</div>

## 延迟加载

```
# 获取`age`字段的5个记录
r.table('users').has_fields('age').limit(5).run(conn)
```
RethinkDB会获取满足该查询的5条记录，并且当查询完成时就立即停止。
如果您使用游标但没有限制获取记录数量，RethinkDB只会做一些工作来可以响应您的请求。这样就能保证没有CPU和网络，硬盘IO浪费了。
和大多数数据库一样RethinkDB支持主键和索引查询来提高查询速度，您还可以使用ReQL创建复合索引，让RethinkDB快速完成复杂的查询。

<div class="infobox "><p>Learn how to use <a href="/docs/secondary-indexes/javascript/">primary and secondary indexes</a> in RethinkDB.</p>
</div>

## 并行
所有ReQL查询都将在RethinkDB实例上尽可能自动并行查询。查询执行将在多个CPU核心，集群中的节点，甚至多个机房之间自动分配。
如果您有大型，复杂需要多阶段处理的查询，RethinkDB会自动将它们分成几个阶段，并行执行每个阶段，并组合数据以返回完整的结果。

## 优化查询(目前版本没有)
While RethinkDB doesn’t currently have a fully-featured query optimizer, ReQL is designed with one in mind. For example, the server has enough information to reorder the chain for efficiency, or to use alternative implementation plans to improve performance. This feature will be introduced into future versions of RethinkDB.

## ReQL函数化查询
目前我们只见过一些简单的查询, 对于复杂查询ReQL支持更加自然的查询方式:
```
# 获取大于30岁的用户
r.table('users').filter(lambda user: user['age'] > 30).run(conn)

# 如果您不喜欢使用lambdas进行查询ReQL还可以这样
r.table('users').filter(r.row['age'] > 30).run(conn)
```
这个查询看起来就像您通常写的其他Python代码。

RethinkDB库内部会检测您的代码，并将它转换成有效的ReQL发送至RethinkDB实例.

* 只要有可能, 应用程序可以使用运算符来作为表达式列如`user['age'] > 30`
* lambda表达式会在RethinkDB库内部构造查询然后发送给RethinkDB实例

<div class="infobox ">
    <p>Read about <a href="/blog/lambda-functions/">how this technology is implemented</a> for more details.</p>
</div>

虽然大多数操作允许您编写熟悉的代码，但是这种方式还有一些局限性。
列如您不能使用有副作用([知乎](https://www.zhihu.com/question/20068456))函数或者控制语句。这样的话您就需要ReQL自带语句:

```
# 错误: 使用if来判断是否用户年龄大于30
r.table('users').filter(lambda user:
    True if user['age'] > 30 else False).run(conn)

# 正确: 使用r.branch来判断用户年龄是否大于30
r.table('users').filter(lambda user:
    r.branch(user['age'] > 30, True, False)).run(conn)
```

<div class="infobox ">
    这样设计具有以下优点：
    <ul>
        <li>对于大多数查询您可以直接使用您已经习惯的代码。</li>
        <li>查询有效地传输到服务器（通过协议缓冲区），并在集群中运行。</li>
        <li>优化查询(目前版本没有)RethinkDB has access to the query structure, which allows for optimization techniques similar to those available in SQL. This feature will be added to RethinkDB in the future.</li>
    </ul>
    但是有些局限性：
        <ul>
            <li>不能在lambda中使用有副作用的函数或者控制语句。</li>
        </ul>
</div>

## ReQL组合查询

您可以组合多个ReQL查询来合并成更加复杂的查询。

___一些简单的命令___

先让我们看一个简单的例子, RethinkDB内嵌一个v8引擎用于运行Javascript(外部沙盒进程):
```
# 在RethinkDB运行一段JS代码并获取结果
r.js('1 + 1').run(conn)
```

因为ReQL可以组合查询所以我们可以把JS代码(r.js)和其他查询组合在一起。列如查询大于30岁的用户:
```
# 查询大于30岁的用户 (在上面的列子也是这个)
r.table('users').filter(lambda user: user['age'] > 30).run(conn)

# 使用内嵌Javascript代码来查询大于30岁的用户
r.table('users').filter(r.js('(function (user) { return user.age > 30; })')).run(conn)
```
RethinkDB无缝调用v8引擎来执行Javascript代码并返回给`filter`。您可以使用这种方式从简单的查询到复杂的查询。

## 子查询

假设我们有一个作者表`authors`，并查询姓同时包含在`users`和`authors`中的作者
```
# 查找姓也在`users`表中的作者
r.table('authors').filter(lambda author:
    r.table('users').pluck('last_name').contains(author.pluck('last_name'))).
    run(conn)
```
在这我们使用了`r.table('users').pluck('last_name')`查询来作为`filter`的子查询。您可以通过这两个查询来构建更加复杂的查询。
如果您有一个RethinkDB集群，并且`authors`,`users`表都被分片。RethinkDB会自动在对应的分片上执行查询并自动返回对应结果。
<div class="infobox ">
    有关此查询的几个注意事项：
    <ul>
        <li>在应用程序完成组合查询后只需要调用一次`run`，记住只要一次</li>
        <li>您同样可以使用`inner_join`命令来完成上述查询.</li>
    </ul>
</div>

## 表达式

编写查询不限于简单的函数和内部查询, 您还可以使用表达式来完成复杂的查询。举个例子：我们想查询工资和奖金不超过9W元的用户，并给这些用户工资+10%:
```
r.table('users').filter(lambda user: user['salary'] + user['bonus'] < 90000)
 .update(lambda user: {'salary': user['salary'] + user['salary'] * 0.1})
```

## 丰富的命令集
除了在这篇文章里描述的命令之外, ReQL还支持其他很多的复杂命令. 如您想了解请阅读下面链接

* Learn how to use map-reduce in RethinkDB.
* Learn how to use table joins in RethinkDB.
* Browse the API reference for more commands.

<div class="infobox">
    这样设计具有以下优点：
    <ul>
        <li>和别的NoSQL语言不用，您可以使用ReQL来创建从简单到复杂的查询</li>
        <li>使用ReQL没有新的语法和命令，一旦您领悟了组合查询原理，那么就不需要学习任何东西就能编写出非常复杂的查询</li>
        <li>子查询可以在变量中抽象化，这允许以与大多数其他现代编程语言所做的相同的方式进行模块化编程。</li>
    </ul>
</div>

## 只是为了好玩，ReQL可以做数学题

只是以防万一您需要一个计算器，ReQL就可以这样来搞了

```
# 2 + 2
(r.expr(2) + r.expr(2)).run(conn)

# 其实您只需要指定一次`r.expr`就可以了
(r.expr(2) + 2).run(conn)

(r.expr(2) + 2 / 2).run(conn)

# 比较
(r.expr(2) > 3).run(conn)

# 分支语句
r.branch(r.expr(2) > 3,
         1,  # if True, return 1
         2   # otherwise, return 2
  ).run(conn)

# 斐波那契序列
r.table_create('fib').run(conn)
r.table('fib').insert([{'id': 0, 'value': 0}, {'id': 1, 'value': 1}]).run(conn)
r.expr([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).for_each(lambda x:
  r.table('fib').insert({'id': x,
                         'value': (r.table('fib').order_by('id').nth(x - 1)['value'] +
                                   r.table('fib').order_by('id').nth(x - 2)['value'])
                        })).run(conn)
r.table('fib').order_by('id')['value'].run(conn)
```

## 了解更多

Browse the following resources to learn more about ReQL:

* Lambda functions in RethinkDB
* Introduction to map-reduce
* Introduction to Joins
* API Reference