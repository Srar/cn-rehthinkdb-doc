# 地理位置查询
RethinkDB支持空间与地理位置查询.

地理位置对象会通过地理坐标系实现，其中点和形状会绘制在三维球体表面上。另外，ReQL可以把地理位置对象转换为缩水的GeoJSON.

在这篇文档中仅仅是对地理位置信息的概要说明，如想了解详细请查阅API文档.

## 开始使用
您可以在Web管理界面 - Data Explorer中来执行这篇文档命令.

创建一个表:
```
r.tableCreate('geo')
```
添加两个点:
```
r.table('geo').insert([
  {
    id: 1,
    name: 'San Francisco',
    location: r.point(-122.423246,37.779388)
  },
  {
    id: 2,
    name: 'San Diego',
    location: r.point(-117.220406,32.719464)
  }
])
```
获取`San Francisco`与`San Diego`点之间的距离:
```
r.table('geo').get(1)('location').distance(r.table('geo').get(2)('location'))
```
为`location`地理位置字段创建索引(某些操作需要使用索引, 如`getNearest`)
```
r.table('geo').indexCreate('location', {geo: true})
```
使用索引来搜索点附近最近的其他点
```
var point = r.point(-122.422876,37.777128);  // `San Francisco`附近
r.table('geo').getNearest(point, {index: 'location'})
```
## 坐标系
球体表面的坐标由一对浮点数来表示：经度与纬度。经度会环绕着整个球体其范围是-180~180，纬度范围是-90(南极)~90(北极).

有关于更多坐标系的信息请查阅维基百科[坐标系](https://zh.wikipedia.org/wiki/%E7%BB%8F%E7%BA%AC%E5%BA%A6)

## 线与距离
ReQL中线是在球体表面上的，当有两个点时两个点之间表面最短路径被称为[测地线](https://zh.wikipedia.org/wiki/%E6%B5%8B%E5%9C%B0%E7%BA%BF)
当然一条线可以由多个点来完成，在多个点组成的线情况下每一段线段都将是测底线；同样多边形的边也是测地线。Geodesics are calculated assuming a perfect sphere.

需要注意的一点是北极(纬度-90度)到南极(北纬90)之间的线最短距离无法被计算，因为在南北极之间的任何可能的路径都是最短的. 这可能会导致ReQL报错(Note that a line between the north pole and south pole (from latitude −90 to latitude 90) cannot be calculated, as all possible paths between them are the “shortest”)

ReQL的球体不是一个完美的球形而是一个椭圆体. 计算两点最短路径使用由[Charles Karney](http://link.springer.com/article/10.1007%2Fs00190-012-0578-z)
发明的快速精准计算算法。使用的参考椭圆体是[WGS84](https://en.wikipedia.org/wiki/World_Geodetic_System)。
默认情况下计算距离会返回米作为单位，您可以指定为公里，英里，海里，或者脚步。

## 数据类型
地理空间功能是通过一组新的几何对象的数据类型实现的:
* ___点___: 由一对经度和纬度坐标组成的点
* ___线___: 由2个或者多个___点___组成
* ___多边形___: 多边形应最少有3个点组成，并且线与自身不相交，同时第一个点的坐标应与最后一个点的坐标相等。多边形内部会被填充并认为是多边形的一部分。
多边形中也包括带有洞的多边形, 带洞的多边形可以使用`polygonSub`命令来创建.

In addition, there’s a “pseudotype” called geometry which appears in documentation, to indicate that any of the geometric objects can be used with those commands.

线与多边形可以使用点对象或者坐标数组来创建:
```
r.line(r.point(0,0), r.point(0,5), r.point(5,5), r.point(5,0), r.point(0,0))
r.line([0,0], [0,5], [5,5], [5,0], [0,0])
```
这两个命令的作用是相同的定义了两个一样的正方形.如果您使用`polygon`而不是`line`来创建那么这个正方形会被填充.

ReQL中没有圆形的数据类型，当您使用`circle`命令来创建圆的时候，ReQL内部只是将多边形尽量类似圆.

## 地理位置索引
创建地理位置索引您只需要使用日常使用的[indexCreate](https://www.rethinkdb.com/api/javascript/index_create/)命令, 不过需要加一个
`geo`参数:
```
r.table('sites').indexCreate('locations', {geo: true})
```
就如同其他的ReQL索引一样，当创建索引的时候您可以使用匿名函数, 而不是一个简单的字段名称。同时可以使用`multi`和`geo`为地理位置信息创建复合索引.
阅读[indexCreate](https://www.rethinkdb.com/api/javascript/index_create)来了解更多.

## 使用GeoJSON
ReQL的地理位置对象并不是[GeoJSON](http://geojson.org/), 
不过你可以使用[geojson](https://www.rethinkdb.com/api/javascript/geojson/)
和[toGeojson](https://www.rethinkdb.com/api/javascript/to_geojson)两个命令来互相转换.

RethinkDB只允许使用等价的GeoJSON对象来转换, 目前已经支持GeoJSON类型有: Point, LineString, and Polygon;MultiPoint, MultiLineString, and MultiPolygon不受支持.

目前坐标仅支持经度与纬度, 当使用其他坐标系，指定高度时被转换的GeoJSON对象会被拒绝.

## FAQ
* ___目前支持多少个纬度?___<br/>
两个纬度：经度与纬度.
* ___目前支持了那些投影坐标?(What projections are supported?)___<br/>
RethinkDB supports the WGS84 World Geodetic System’s reference ellipsoid and geographic coordinate system (GCS). It does not directly support any projected coordinate system (PCS), but there are many tools available for performing such projections.
* ___Does RethinkDB do a correct interpolation of degrees to meters along a path?___<br/>
Yes. Distance calculations are done on a geodesic (either WGS84’s reference ellipsoid or a unit sphere).
* ___是否能导出为WKT或WKB?___<br/>
不能，但是你可以导出为GeoJSON然后通过工具转换.

## 地理位置命令
* [geojson](https://www.rethinkdb.com/api/javascript/geojson/): 将GeoJSON对象转换为地理位置对象
* [toGeojson](https://www.rethinkdb.com/docs/geo-support/javascript/to_geojson/)/
[to_geojson](https://www.rethinkdb.com/api/javascript/to_geojson/): 将地理位置对象转换为GeoJSON对象
* [point](https://www.rethinkdb.com/api/javascript/point/): 创建点对象
* [line](https://www.rethinkdb.com/api/javascript/line/): 创建线对象
* [polygon](https://www.rethinkdb.com/api/javascript/polygon/): 创建多边形对象
* [circle](https://www.rethinkdb.com/api/javascript/circle/): 创建一个近似圆或面
* [distance](https://www.rethinkdb.com/api/javascript/distance/): 计算两个几何对象的距离
* [intersects](https://www.rethinkdb.com/api/javascript/intersects/): 判断几何对象是否相交
* [includes](https://www.rethinkdb.com/api/javascript/includes/): 判断一个地理位置或几何对象是否被另一个几何对象包围
* [getIntersecting](https://www.rethinkdb.com/api/javascript/get_intersecting/): 返回具有地理位置索引字段的序列中的记录
* [getNearest](https://www.rethinkdb.com/api/javascript/get_nearest/): 返回具有地理空间索引字段的序列中的记录，其值在给定点的指定距离内
* [polygon_sub](https://www.rethinkdb.com/api/javascript/polygon_sub/): 创建一个具有洞的多边形





