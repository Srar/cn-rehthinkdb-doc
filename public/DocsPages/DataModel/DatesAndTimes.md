# RethinkDB中的日期与时间
RethinkDB原生支持精确至毫秒的带时区时间. 以下有一些说明:

* 在应用程序中操作RethinkDB中的时间会由RethinkDB库来自动完成转换
* 查询能够察觉到不同的时区，因此你可以查询“这个事件有没有在它被记录的时区的周一发生？”
* 时间当做发生事件的索引可以帮助你高效检索时间区间内事件
* ReQL可以完全来操作时间，这意味着即使是复杂的日期时间查询也可以在集群中有效地分布

<p>
    <img src="/DocsPages/images/dates-and-times.png" class="api_command_illustration">
</p>

## 简单例子
首先创建一个表然后插入一些事件. 我们插入第一个事件会使用原生的日期对象，第二个事件会用`epochTime`构造函数:
```
r.tableCreate('events').run(conn, callback);

r.table('events').insert([
    {id: 0, timestamp: new Date()},
    {id: 1, timestamp: r.epochTime(1376436769.923)}
]).run(conn, callback);
```
现在我们来看看插入的事件实际时间:
```
> r.table('events');
// 结果
[
    { "id": 0, "timestamp": Date("2013-08-13T23:32:49.923Z") },
    { "id": 1, "timestamp": Date("2013-08-13T23:32:49.923Z") }
]
```
您会注意到上述插入的两个事件时间都是Javascript的原生`Date`对象(Javascript中的`Date`对象不会存储时区信息，所以两个事件时间都是UTC时间，而不是服务器本地时间)

现在我们来试试基于时间来筛选数据:
```
> r.table('events').filter(r.row('timestamp').hours().gt(20)).run(conn, callback);
// 结果
[ { "id": 1, "timestamp": Date("2013-08-13T23:32:49.923Z") } ]
```
或者为`timestamp`来创建索引:
```
> r.table('events').indexCreate('timestamp').run(conn, callback);

> r.table('events').between(r.epochTime(1376436769.913),
      r.epochTime(1376436769.933), {index: 'timestamp'}
  ).run(conn, callback);
// 结果
[ { "id": 1, "timestamp": Date("2013-08-13T23:32:49.923Z") } ]
```

## 内部细节
时间的存储方式是UTC毫秒时间加上时区的秒时间.目前唯一支持时区的方式是手动加上时区秒数，未来可能会增加对DST(夏令时)时间的支持。
目前存储时间字符串使用的编码为ISO 8601.当你使用Javascript操作时间的时候要注意，由于Javascript的`Date`对象限制
所以Javascript的RethinkDB库会删除时区信息。所以如果有需要可以使用ReQL原生时间对象来查询带时区的记录。

当查询时间时查询的时间UTC值和记录UTC值为相同时说明两个时间相等，不会受到时区的影响. This is true for both comparisons and indexed operations. Times are compared in floating point with millisecond precision.

目前可以操作的日期范围为:1400~10000年之间.

目前闰秒支持不是很好: `2012-06-30T23:59:60`和`2012-07-01T00:00:00`会判断为相等.

## 插入时间记录
你插入时间记录可以使用原生的`Date`对象:
```
> r.table('events').insert({id: 2, timestamp: new Date()}).run(conn, callback);
// 结果
{"unchanged"=>0, "skipped"=>0, "replaced"=>0, "inserted"=>1, "errors"=>0, "deleted"=>0}
```
你也可以使用`r.now`(`r.now`会返回RethinkDB实例服务器的UTC时间)或使用时间构造方法: `r.time`, `r.epochTime`, `r.ISO8601`:
```
> r.now().toISO8601().run(conn, callback);
// 结果
"2013-08-09T18:53:15.012+00:00"

> r.time(2013, r.august, 9, 18, 53, 15.012, '-07:00').toISO8601().run(conn, callback);
// 结果
"2013-08-09T18:53:15.012-07:00"

> r.epochTime(1376074395.012).toISO8601().run(conn, callback);
// 结果
"2013-08-09T18:53:15.012+00:00"

> r.ISO8601("2013-08-09T18:53:15.012-07:00").toISO8601().run(conn, callback);
// 结果
"2013-08-09T18:53:15.012-07:00"
```
时间可以被当做一个表的主键，如果两个记录的UTC时间一样不管时区如何则判断为相等.
```
> r.table('t').insert(
      {id: r.ISO8601("2013-08-09T11:58:00.1111-07:00")}
  ).run(conn, callback);
// 结果
{"unchanged"=>0, "skipped"=>0, "replaced"=>0, "inserted"=>1, "errors"=>0, "deleted"=>0}

> r.table('t').insert(
      {id: r.ISO8601("2013-08-09T10:58:00.1111-08:00")}
  ).run(conn, callback);
// 结果
{"unchanged"=>0, "skipped"=>0, "replaced"=>0, "inserted"=>0,
 "first_error"=>"Duplicate primary key `id`: ...", "errors"=>1, "deleted"=>0}
```
您可以使用字符串来表达伪时间类型，This is useful if, for instance, you exported a row using {timeFormat: 'raw'} (see Retrieving Times below).

> 注意请不要使用`^\$reql_.+\$$`正则的键，因为这会被RethinkDB认为是关键词.

```
r.expr(
      {'$reql_type$': 'TIME', epoch_time: 1376075362.662, timezone: '+00:00'}
  ).run(conn, callback);
// 结果
Date("2013-08-09T19:09:22.662Z")
```

## 查询时间
默认情况下，查询数据会把时间转换成原生的时间对象.这可以通过`timeFormat`传递给`run`来控制.
目前只有两个选项默认的一个`native`, 和`raw`. 如果您不确定如何在Javascript中传递可选参数，可以查询[API文档](https://www.rethinkdb.com/api/javascript/)
```
> r.now().run(conn, callback);
// 结果
Date("2013-08-13T23:32:49.923Z")

> r.now().inTimezone('-07:00').run(conn, callback);
// 结果: same as above, no TZ info retrieved
Date("2013-08-13T23:32:49.923Z")

> r.now().run(conn, {timeFormat: 'raw'}, callback);
// 结果
{
  "$reql_type$": "TIME",
  "epoch_time": 1423077622.659,
  "timezone": "+00:00"
}

> r.now().inTimezone('-07:00').run(conn, {timeFormat: 'raw'}, callback);
// 结果
{
  "$reql_type$": "TIME",
  "epoch_time": 1423077646.772,
  "timezone": "-07:00"
}
```
您也可以通过`toEpochTime`或`toISO8601`来转换时间对象:
```
> r.now().toEpochTime().run(conn, callback);
// 结果
1376075986.574

> r.now().toISO8601().run(conn, callback);
// 结果
"2013-08-09T19:19:46.574+00:00"
```

## 修改时间
您可以按秒为单位添加时间或者减少时间:
```
> r.time(2015, 1, 1, 'Z').add(86400).run(conn, callback);
// 结果
Fri Jan 02 2015 00:00:00 GMT+00:00
```
您也可以使用两个时间相减，得到的结果也是以秒为单位的:
```
> r.time(2015, 1, 2, 'Z').sub(r.time(2015, 1, 1, 'Z')).run(conn, callback);
// 结果
86400
```

## 时间比较
与正常的比较操作一样来比较时间:
```
> r.epochTime(1376081287.982).lt(new Date()).run(conn, callback);
true
```
以毫秒为单位来比较时间:
```
> r.epochTime(1376081287.9821).eq(r.epochTime(1376081287.9822)).run(conn, callback);
true
```
还可以通过[during](https://www.rethinkdb.com/api/javascript/during)命令来确定时间是否在范围内.

## 查询时间部分
你可以查询时区时间一部分(比如查询时间的小时部分，或者月部分). 完整说明请查阅[API文档](https://www.rethinkdb.com/api/javascript/)
```
> r.expr(new Date()).run(conn, callback);
// 结果
"2013-08-13T23:32:49.923Z"

// 查询月部分
> r.expr(new Date()).month().run(conn, callback);
// 结果
8

// 查询小时部分
> r.expr(new Date()).hours().run(conn, callback);
// 结果
23

// 查询时区偏移后的时间小时部分
> r.expr(new Date()).inTimezone('-06:00').hours().run(conn, callback);
// 结果
17
```
当使用ISO 8601来存储时间时，星期一会从1开始:
```
> r.expr(new Date()).dayOfWeek().run(conn, callback);
5 # 星期五
```
为了方便起见我们已经帮你定义了星期枚举`r.monday...r.sunday`和`r.january...r.december`:
```
// 查询今天是不是星期五
> r.expr(new Date()).dayOfWeek().eq(r.friday).run(conn, callback);
true
```
We also let you slice the time into the date and the current time of day (a time and a duration, respectively):
```
// 时间戳
> r.now().toEpochTime().run(conn, callback);
// Result passed to callback
1376351312.744

> r.now().date().toEpochTime().run(conn, callback);
// Result passed to callback
1376265600

// 自UTC 0点开始已经过去了几秒
> r.now().timeOfDay().run(conn, callback);
// Result passed to callback
85712.744
```

## 结合全部操作
您可以通过上述讲的操作来写出牛逼的ReQL查询.假设您有个公司销售表，您想知道营业额中有多少是来自加班员工所赚取的并假设您的公司销售处分布在全球各地并且员工工作时间是根据时区时间戳存放的:
```
r.table('sales').filter(function (sale) {
    // 周末加班
    return sale('time').dayOfWeek().eq(r.saturday).or(
        sale('time').dayOfWeek().eq(r.sunday)).or(
        // 工作日超过工作时间(9-17点)
        sale('time').hours().lt(9)).or(
        sale('time').hours().ge(17));
}).sum('dollars').run(conn, callback);
```
如果您有一个RethinkDB集群，上述查询会也会自动分发在集群内各节点无需客户端介入.

现在~~产品~~经理又有新需要了，需要导出每个月的员工加班赚取情况。不过有ReQL不需要担心，因为可以查询各部分很容易拼装:
```
r.table('sales').filter(function (sale) {
    // 周末加班
    return sale('time').dayOfWeek().eq(r.saturday).or(
        sale('time').dayOfWeek().eq(r.sunday)).or(
         // 工作日超过工作时间(9-17点)
        sale('time').hours().lt(9)).or(
        sale('time').hours().ge(17));
}).group(function (sale) {
    // 基于月进行分组
    return sale('time').month();
}).sum('dollars').run(conn, callback);
```



