# 探索RethinkDB中您可能会用到的命令
Akshay Chougule是一位生物学家他写了一篇关于如何实际使用[Unix中使用常见shell来在数据集中查询数据](http://datavu.blogspot.com/2014/08/useful-unix-commands-for-exploring-data.html).
所以我们也打算写一篇类似的: 如何在 WebUI - Data Explorer即时使用ReQL来查询数据。

在这里我们会使用[IMDb Top 250](http://www.imdb.com/chart/top)做为数据集来练手
(当写这篇doc时候抓去top 250的时间是14-08-26,所以你现在去看估计数据有不同但是不要慌).IMDb仅提供了文本格式的数据，为了方便期间我们把数据转换成了JSON
: [http://libs.x-speed.cc/top-250-ratings.json](http://libs.x-speed.cc/top-250-ratings.json)

由于上述说的top-250-ratings.json是放在网上的，所以你做的仅仅只需要创建表然后通过[http](https://www.rethinkdb.com/docs/http)来导入数据，
在Data Explorer中执行以下命令即可:
```
r.tableCreate('movies');
r.table('movies').insert(r.http('http://libs.x-speed.cc/top-250-ratings.json'))
```
Data Explorer应该会返回这些信息:
```
{
	"deleted": 0 ,
	"errors": 0 ,
	"generated_keys": [
	"bbf81f4d-2a6d-40bb-9b5d-b6e288cc8795" ,
	"0d6054f4-12b0-4c2e-b221-881441c779c4" ,
	...
	] ,
	"inserted": 253 ,
	"replaced": 0 ,
	"skipped": 0 ,
	"unchanged": 0
}
```
这个表会有6个字段: `id`(主键), `rank`(IMDb rank排名 1-250), `rating`(分级 1-10), `title`, `votes`和`year`.

## 获取排名第一的电影
我们可是使用`filter({rank: 1})`来找到排名第一的电影:
```
r.table('movies').filter({rank: 1})

[
	{
		"id":  "bbf81f4d-2a6d-40bb-9b5d-b6e288cc8795" ,
		"rank": 1 ,
		"rating": 9.2 ,
		"title":  "The Shawshank Redemption" ,
		"votes": 1262930 ,
		"year": 1994
	}
]
```
『Shawshank』已经在IMDb排行榜第一更多年了.

## 删除重复的记录
如果您注意了插入时候的返回结果会看到`"inserted": 253`说明有253条记录被插入了二不是250.
这其中肯定必有蹊跷一定是有一些记录重复了. 
我们可以使用`distinct`来过滤掉完全一样的记录, 但是需要先把`id`字段给排除掉因为每个记录的`id`字段是不同的.
```
r.table('movies').without('id').distinct().count()

250
```
返回无重复的top movies 250
```
r.table('movies').without('id').distinct()
```
我们将过滤重复好的结果通过`insert`命令放进另一个新表中，原记录的`id`字段会被重新生成. 
这时候又要吹逼了看ReQL多方便，很容易就可以把一个查询结果丢到另一个查询去.
```
r.tableCreate('moviesUnique');
r.table('moviesUnique').insert(
	r.table('movies').without('id').distinct()
)
```
现在我们有一个干净无重复的数据表了，可以弄一些查询在Table view(Data Explorer查询结果后的Table view选项)显示报表。
如果您有强迫症不喜欢看见`id`字段一串东西可以使用`.without('id')`来排除`id`字段.

## 排名前10的电影
```
r.table('moviesUnique').orderBy('rank').limit(10)
```

## 排名倒数前10的电影
```
r.table('moviesUnique').orderBy(r.desc('rank')).limit(10)
```

## 第1,2,6和最后一名的电影
```
r.table('moviesUnique').filter(function (doc) {
  return r.expr([1, 2, 6, r.table('moviesUnique').max('rank')('rank')]).
    contains(doc('rank'));
}).orderBy('rank');
```

## 排名前25的电影投票平均数
```
r.table('moviesUnique').orderBy('rank').limit(25).max('year')
```

## 查询投票数小余100000的排名最高的电影
```
r.table('moviesUnique').filter(r.row('votes').lt(100000)).min('rank')
```