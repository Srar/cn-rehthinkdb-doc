# 编写RethinkDB库

RethinkDB库负责序列化请求, 并将序列化的请求使用ReQL协议发送至RethinkDB服务器,
同时接受从RethinkDB服务器的响应并将其返回给应用程序. 大致步骤如下:

* 打开连接
* 握手
* 序列化查询
* 发送信息
* 接受信息

## 首先

ReQL类型与命令被定义在[ql2.proto](https://github.com/rethinkdb/rethinkdb/blob/next/src/rdb_protocol/ql2.proto)文件中.

对于JavaScript定义文件需要在`rethinkdb` repo中执行`make js-driver`, 然后定义文件会生成在`build/packages/js/proto-def.js`.
或者您也可以在[rethinkdbdash](https://github.com/neumino/rethinkdbdash/blob/master/lib/protodef.js)直接获取这个文件.

`ql2.proto`文件中带有每个命令参数与输出的详细注释.

## 打开连接

创建一个TCP连接, 连接其至RethinkDB服务器的`driver port`端口. `driver port`端口默认监听在`28015`.

## 握手

### Version V1_0

客户端发送int4字节小端序的magic number作为协议版本号: 
```
 SEND c3 bd c2 34
```

当RethinkDB服务器响应成功时会返回一段JSON, 其中包括最小与最大支持的协议版本和RethinkDB实例版本号.

```json
 {
     "success": true,
     "min_protocol_version": 0,
     "max_protocol_version": 0,
     "server_version": "2.3.0"
 }
```

失败情况下RethinkDB服务器会直接返回一段字符串:
```
 ERROR: Received an unsupported protocol version. This port is for RethinkDB queries. Does your client driver version not match the server?
```
然后客户端发送一段JSON内部包含协议版本号(`protocol_version`)和验证方式(`authentication_method`)以及验证信息(`authentication`).
Rethink目前仅支持一种验证方式: 遵循了[IETF RFC 7677](https://tools.ietf.org/html/rfc7677)与[RFC 5802](http://ip-doc.com/rfc/rfc5802)的`SCRAM-SHA-256`. 
不过RethinkDB没有遵循RFC中的`e=`字段作为错误信息的返回, 而是使用了RethinkDB自有的数据结构来返回错误信息.
`authentication`中包含了RFC 5802的"client-first-message"其中`n=`代表用户名, `r=`代表随机内容.

```json
 {
     "protocol_version": 0,
     "authentication_method": "SCRAM-SHA-256",
     "authentication": "n,,n=user,r=rOprNGfwEbeRWgbNEkqO"
 }
```

RethinkDB服务器会响应一个带有`"success"`的json字段, 其值类型为`true`或`false`. 在`true`情况下
json字段还会包含一个`"authentication"`"server-first-message"字段其中`i=`代表迭代次数, `s=`代表salt, `r=`代表随机生成的一段字符.

```json
 {
     "success": true,
     "authentication": "r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0,
       s=W22ZaJ0SNY7soEsUEjb6gQ==,i=4096"
 }
```

在`false`情况下服务器会返回一个错误信息以及错误代码.

```json
{
     "success": false,
     "error": "You mucked up.",
     "error_code": 12
 }
```
如果错误代码在10~20之间您的RethinkDB库应该抛出`ReqlAuthError`异常.

之后客户端发送"client-final-message"其中包括上个步骤随机生成的字符以及遵循RFC生成的ClientProof.

```json
 {
     "authentication": "c=biws,r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0,
       p=dHzbZapWIk4jUhN+Ute9ytag9zjfMHgsqmmiz7AndVQ="
 }
```

最后RethinkDB服务器会响应, 响应"server-final-message", 其中带有字段`"success"`其值类型为`true`或`false`. 
在`true`情况下, `"authentication"`字段会带有ServerSignature. 客户端应当遵循RFC规定自行计算ServerSignature值并比对是否一样.
在`false`情况下, 会服务器将会发送错误信息以及错误代码.

> 您可以在发出握手第一个(magic number)请求后可以立即发送第二个请求(client-first-message)来加速握手速度.

### Version V0_3与 V0_4

___注意:___ 这两个协议版本不支持RethinkDB用户与权限, 在未来版本中可能会弃用. 与RethinkDB2.3或更高版本通讯时authentication key将会与admin用户的密码进行比较.

* 发送协议版本(小端序四字节整数).
* 发送authentication key长度. 如果发送`0`说明没有authentication key.
* 发送authentication key(ASCII). 如果没有则跳过这个步骤.
* 发送协议类型(小端序四字节整数). 协议类型被定义在`ql2.proto`的`Protocol`枚举中. 新RethinkDB库应当使用JSON来传递协议类型.

随后RethinkDB服务器会返回ASCII字符串. 如果字符串为`"SUCCESS"`, 客户端开始进行第二阶段的通讯. 如果为其他字符串RethinkDB库应当以字符串作为异常信息抛出.

### Example 1: 不带有auth key情况

| 步骤   | 操作   | Element     | Bytes                   |
| ---- | ---- | ----------- | ----------------------- |
| 1    | 发送   | ` V0_4`     | ` 20 2d 0c 40`          |
| 2    | 发送   | auth key 长度 | ` 00 00 00 00`          |
| 3    | 发送   | auth key    |                         |
| 4    | 发送   | JSON        | `c7 70 69 7e`           |
| 5    | 接收   | success     | ` 53 55 43 43 45 53 53` |

### Example 2: 带有auth key情况

| 步骤   | 操作   | Element     | Bytes                   |
| ---- | ---- | ----------- | ----------------------- |
| 1    | 发送   | ` V0_4`     | ` 20 2d 0c 40`          |
| 2    | 发送   | auth key 长度 | ` 07 00 00 00`          |
| 3    | 发送   | auth key    | ` 68 75 6e 74 65 72 32` |
| 4    | 发送   | JSON        | `c7 70 69 7e`           |
| 5    | 接收   | success     | ` 53 55 43 43 45 53 53` |

## 序列化查询

您编写的RethinkDB库应当正对每个连接分配一个独一无二的8字节token(RethinkDB官方库针对每个连接计数(8字节无符号小端序整数), 将计数的数分配给连接.).RethinkDB服务器响应查询时会将token作为标识符以便您来区分查询. 同时如果第一次查询没有返回全部结果记录那么您还可以使用这个token请求后续的结果记录.

### 简单例子

在下面本文会解释如何构建一个复杂的查询. 不过我们先从简单的查询开始, 我们先往RethinkDB服务器发送一个字符串`"foo"`(`r.expr("foo")`).

发送这个查询至RethinkDB服务端有以下几个步骤:

* 将查询序列化为UTF8编码的JSON.
* 已以下步骤发送到服务器
    * 生成8字节token
    * 以4字节小端序整数计算JSON的长度
    * 封装查询(查询类型, 已序列化的查询, 其他选项).

发送至RethinkDB服务端已封装查询是一个带有3个元素的数组:
```
[ QueryType, query, options ]
```
在下面文章中我会给你说明更多内容, 不过目前为止我们先给你说明下在这个例子中`QueryType`的值为`1`(或者为`START`, 这个我们会在下面文章中看见),
`query`的值为`"foo"`并且没有options. 所以封装好的的JSON如下:
```json
[ 1, "foo", {} ]
```
随后我们将这个JSON以以下步骤发送至服务器:

| 步骤   | Element     | Bytes                     |
| ---- | ----------- | ------------------------- |
| 1    | query token | `00 00 00 00 00 00 00 01` |
| 2    | JSON长度      | `0c 00 00 00`             |
| 3    | JSON数据      | ` [1,"foo",{}]`           |

当这3个步骤发送完毕之后, 您就可以已以下步骤来从服务器接受响应数据了:

* 8字节token
* 响应数据的长度(4字节小端序整数)
* JSON数据

| 步骤   | Element     | Bytes                     |
| ---- | ----------- | ------------------------- |
| 1    | query token | `00 00 00 00 00 00 00 01` |
| 2    | JSON长度      | `13 00 00 00`             |
| 3    | JSON数据      | `{"t":1,"r":["foo"]}`     |

当您转换JSON称为对象时候, 您就会拿到这样的对象:

```json
{
    t: 1,         // protodef.Response.ResponseType.SUCCESS_ATOM
    r: ["foo"]    // the response is the string 'foo"
}
```

`t:1`代表响应的数据是一个值, 并且`r: ["foo"]`代表`foo`.

### ReQL查询
ReQL是一个计算机[领域专用语言](http://en.wikipedia.org/wiki/Domain-specific_language).
目前官方4个编程语言的RethinkDB库都遵循了类似的语法, 您编写RetinkDB库也应当遵循类似语法.

ReQL在内部会将查询解析为树:
```javascript
r.db("blog").table("users").filter({name: "Michel"})
```
![](/DocsPages/images/query_tree.png)

### ReQL命令
ReQL命令看起来像是一个数组中包含2个或3个元素:
```
[<command>, [<arguments>], {<options>}]
```
* `<command>`是一个枚举整数类型, 其被定义在`ql2.proto`中.
* `<arguments>` 作为command的查询参数.
* `<options>` 作为command的可选参数.

因此刚刚的查询:
```javascript
r.db("blog").table("users").filter({name: "Michel"});
```
会被解析成这样:
```
/* from `ql2.proto` */
FILTER = 39
TABLE = 15
DB = 14

r.db("blog") =>
    [14, ["blog"]]

r.db("blog").table("users") =>
    [15, [[14, ["blog"]], "users"]]

r.db("blog").table("users").filter({name: "Michel"}) =>
    [39, [[15, [[14, ["blog"]], "users"]], {"name": "Michel"}]]

```

__IMPLEMENTATION CONSIDERATIONS__

如果您想使用前缀表达式, 那么您只需要将全部command在module中实现.
如果您想使用中缀表达式, 那么您需要实现在"term"类中的全部方法以及在module中实现一部分前缀表达式.

You can only check arity of the methods to a certain extent. If an `ARGS` term is one of the argument, only the server can effectively verify that enough arguments are provided (or not too many). The arity errors reported by the server suppose a prefix notation. Things may change if the solution in [#2463](https://github.com/rethinkdb/rethinkdb/issues/2463#issuecomment-44584491) is implemented.

__ReQL Data__

datum数据是可以是在JSON表现出来的列如: booleans, numbers, strings, objects, arrays 与 `null`. 这些可以发送至RethinkDB服务器.

不过Arrays有些在ReQL中有些特别, 当您发送Arrays至服务器时您必须使用`MAKE_ARRAY`命令, 并将Arrays作为参数来发送.

```json
[10, 20, 30]
```

应当封装为:

```json
/* MAKE_ARRAY = 2 (from ql2.proto) */

[2, [10, 20, 30]]
```

__ReQL 伪类型__

ReQL中的一些类型无法在JSON中被表示, 这些类型会表示为伪类型. 伪类型的JSON对象会带有`$reql_type$`字段来表示类型.
目前3个RethinkDB官方库提供了date与binary数据伪类型转换.

Date日期数据: 
```json
{
    $reql_type: "TIME",
    epoch_time: <timestamp>,
    timezone: <string>
}
```
* `epoch_time`字段为unix时间戳, 精度精确到毫秒.
* `timezone`字段为UTC时间偏移(俗称时区)格式为: `[+-]HH:MM`. 例如: UTC时间`+00:00`, 太平洋时间: `-08:00`.


Binary二进制数据:
```json
{
    $reql_type$: "BINARY",
    data: <string>
}
```
* `data`字段为二进制数据被base64后的字符串.

__匿名函数__

有一位大佬[Bill Rowan](https://github.com/wmrowan)写了一篇[文章](http://www.rethinkdb.com/blog/lambda-functions/)解释了在RethinkDB库中的匿名函数(或者称为lambda函数). 这篇文章描述了匿名函数的优点以及是如何工作的, 所以在此我就仅仅说明如何序列化匿名函数.

当解析到匿名函数时, 应当被封装为以下对象:
```json
/* FUNC = 69, MAKE_ARRAY = 2 (from ql2.proto) */

[69, [[2, [p1, p2, ...]], function body]]
```

`<p1>`, `<p2>`是匿名函数的实参, 其值可以为任意值.
为了避免明明冲突, 在函数内使用的变量使用`VAR`命令, 其在`ql2.proto`中的枚举值是`10`.
所以获取实参的第一个参数序列化封装好后的结果是`[10, [1]]`.

再假设有个匿名函数:
```javascript
function(x, y, z) {
    return r.add(x, y, z)
}
```

序列化后:

```json
[FUNC, 
 [[MAKE_ARRAY, [1, 2, 3]],
  [ADD,
   [[VAR, [1]],
    [VAR, [2]],
    [VAR, [3]]]]]]

/* FUNC = 69, MAKE_ARRAY = 2, ADD = 24, VAR = 10 (from ql2.proto) */

[69, [[2, [1, 2, 3]], [24, [[10, [1]], [10, [2]], [10, [3]]]]]]
```

序列化匿名函数功能很大程序取决于您使用哪个语言编写的RethinkDB库. 在JavaScript中分为以下几步:

* 了解下匿名函数有几个参数
* 为使用到的参数创建`VAR`命令
* 已使用到的参数来调用函数
* 将结果序列化为函数体.

如您的RethinkDB库使用了中缀表达式, 请确保您已对ReQL中的全部方法实现了`VAR`.

__序列化 IMPLICIT_VAR(R.ROW)__

IMPLICIT_VAR相当于RethinkDB官方实现的JavaScript与Python库的[row](https://www.rethinkdb.com/api/python/row)命令.
其对方法参数嵌套有很大程度的优化.

如果您想在您的RethinkDB库内支持`IMPLICIT_VAR`的话, 您应当在解析方法实参的时候检测方法内是否能带有函数.
如果其带有函数您应当再查找是否有`IMPLICIT_VAR`(或者叫做`row`). 并且转换成以下格式:

```json
[69, [[2, [1]], argument]]
```

如果参数中不带有函数则已正常情况处理.

__序列化Binary二进制数据__

创建`r.binary`二进制对象有两种方式:

如果数据是ReQL数据则直接可以使用`BINARY`命令:
```json
[BINARY, argument]
```

如果数据是应用程序传输过来的二进制数据则应当在传输前将数据进行base64, 然后通过伪类型来传输执行:
```json
{
    $reql_type$: "BINARY",
    data: <base64 string>
}
```

__序列化 FUNCALL(R.DO)__

`r.do()`会被序列化为`FUNCALL`.

```json
[FUNCALL, [function], arguments]
```

例如:

```javascript
r.do(10, 20, function (x, y) {
  return r.add(x, y);
})
```

序列化后:

```json
[FUNCALL,
  [FUNC,
    [[MAKE_ARRAY, [1, 2]],
      [ADD,
        [[VAR, [1]],
         [VAR, [2]]]]]],
  10,
  20]

// FUNCALL = 64, FUNC = 69, MAKE_ARRAY = 2, ADD = 24, VAR = 10

[64, [69, [[2, [1, 2]], [24, [[10, [1]], [10, [2]]]]]], 10, 20]
```

> `r.do()`被传递的方法是最后一个参数, 但是序列化为`FUNCALL`之后却是第一个参数.

## 发送信息

ReQL中使用者可以链式调用方法, 所以您需要提供一个方法给使用者来说明这段ReQL已经调用结束了可以将其发送至RethinkDB服务器了.
在RethinkDB官方库内我们提供了`run`方法来指示说链式调用已经结束并发送至服务器.

__封装查询__

调用[run](https://www.rethinkdb.com/api/python/run)命令后应当将查询序列化, 然后已以下格式发送至服务器:
```json
[ QueryType, query, options ]
```

QueryType被定义在`ql2.proto`中. 当进行一次新的查询时`QueryType`应当为`START`(`1`).
`options`是作为`run`命令的可选参数.

`QueryType`的值有以下几种:
* `1` `START`: 一个新的查询.
* `2` `CONTINUE`: 继续已经返回`SUCCESS_PARTIAL`的查询.
* `3` `STOP`: 停止正在运行的查询.
* `4` `NOREPLY_WAIT`: 等待无回应操作完成. 服务器将会返回`WAIT_COMPLETE`回应.
* `5` `SERVER_INFO`: 询问服务器信息. 服务器将会返回`SERVER_INFO`回应.

__发送查询__

发送查询至服务器分以下几步:

* 将查询序列化为UTF8编码的JSON.
* 已以下步骤发送到服务器
    * 生成8字节token
    * 以4字节小端序整数计算JSON的长度
    * 封装查询(查询类型, 已序列化的查询, 其他选项).

您需要为每个连接分配一个token, 您可以用最简单的方法:计数器方式. 给每个连接计数, 然后计数分配给连接.

这里我们有个简单的查询:

```javascript
r.db("blog").table("users").filter({name: "Michel"})
```

| 步骤   | Element     | Bytes                     |
| ---- | ----------- | ------------------------- |
| 1    | query token | `00 00 00 00 00 00 00 01` |
| 2    | 长度      | `3c 00 00 00`             |
| 3    | 数据      | `[1,[39,[[15,[[14,["blog"]],"users"]],{"name":"Michel"}]],{}]`           |

__带有可选项的查询__

在`run`命令可选项中有个`db`可选项,其作用就像`r.db("blog")`一样:

```javascript
r.table("users").run({db: "blog"});
```

```json
[1,[15,["users"]],{"db":[14,["blog"]]}]
```

## 接受信息

从服务器接受查询结果分以下几步:

* 8字节token
* 响应数据的长度(4字节小端序整数)
* `Response` Object JSON数据

`Response`Object中有以下字段:

* `t`: 被定义在`ql2.proto`中的`ResponseType`.
* `r`: JSON结果数组.
* `b`: 如果`t`字段内容是错误内容则该字段存在.
* `p`: 如果全局`profile: true`则该字段存在.
* `n`: 可选数组, 其值被定义在`ql2.proto`中的`ResponseNote`.

__Response types__

Response types是被定义在`ql2.proto`中的整数.

* `1` `SUCCESS_ATOM`: 整个查询已返回, 结果在`r`字段中下标为0的位置.
* `2` `SUCCESS_SEQUENCE`: 整个查询已返回在`r`字段中, 或者单个查询多个响应的最后一个查询已被返回.
* `3` `SUCCESS_PARTIAL`: 查询返回了一个已完成或未完成的流.
* `4` `WAIT_COMPLETE`: `noreply`模式中完成查询, 此时`r`字段为空.
* `5` `SERVER_INFO`: 回应`SERVER_INFO`请求, 结果在`r`字段中下标为0的位置.
* `16` `CLIENT_ERROR`: 客户端发送的请求有误, 错误信息在`r`字段中下标为0的位置.
* `17` `COMPILE_ERROR`: ReQL编译错误, 错误信息在`r`字段中下标为0的位置.
* `18` `RUNTIME_ERROR`: ReQL编译通过, 运行时发生错误, 错误信息在`r`字段中下标为0的位置.

__Response notes__

如果`n`存在于服务器响应中, 那么这个字段会是一个数组, 数组内的值可以在`ql2.proto`中的`ResponseNote`找到定义.

`ResponseNote`的值都有关于RethinkDB的changefeeds功能.

* `1` `SEQUENCE_FEED`: 流是changefeed.
* `2` `ATOM_FEED`: 流是point changefeed. 例如: 返回单个记录的改变.
* `3` `ORDER_BY_LIMIT_FEED`: 由`order_by().limit()`生成的流查询.
* `4` `UNIONED_FEED`: 流是由多个changefeed合并, 并且不能转为单个类型. 例如: `r.table('test').changes().union(r.table('test').get(0).changes())`.
* `5` `INCLUDES_STATES`: 流包含states的changefeed.

__Multipart responses__

Streams与feeds都是懒加载的, 当时返回懒加载的数据时`ResponseType`会为`SUCCESS_PARTIAL`(`3`), 并且懒加载的数据会在`r`字段中.
当您的RethinkDB库接受到stream或feed时, 应当向使用者返回一个游标(或类似可遍历的接口).
如果想继续请求数据您可以在同一个连接内同一个token向RethinkDB服务器发送`QueryType`为`CONTINUE`的查询

| 步骤   | Element     | Bytes                     |
| ---- | ----------- | ------------------------- |
| 1    | query token | `00 00 00 00 00 00 00 01` |
| 2    | 长度      | `03 00 00 00`             |
| 3    | 数据      | `[2]`           |

然后您将会收到RethinkDB服务器的`SUCCESS_PARTIAL`回应, 其`r`字段内还是带有后续的数据.
如您受到了`SUCCESS_SEQUENCE`代表流已经至结尾了没有数据可返回了.

如果您想关闭stream或feed, 您可以在同一个连接内同一个token向RethinkDB发送`QueryType`为`STOP`的查询.