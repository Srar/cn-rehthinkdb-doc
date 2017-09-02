# 一致性保证

RethinkDB中有3个选项可以来调整一致性与持久性: write acknowledgements, durability与read mode.

## 设置
* __Write acknowledgements__: 设定每个表的每个写入操作是否需要绝大多数副本写确认后才返回写入成功. 
    您可以使用[config](https://www.rethinkdb.com/api/javascript/config/)命令来
    调整`table_config`系统表中每个表的`write_acks`属性.
    默认情况下此值为`majority`代表了每次写操作都要经过绝大多数副本写确认后才返回写入成功.
    您也可以将此值修改为`single`来设置写操作只要有一个副本写确认那么就写入成功.
* __Durability__: 设定每个表的每个写操作是否在数据落盘之后才返回写确认. 
    您可以使用[config](https://www.rethinkdb.com/api/javascript/config/)命令来
    调整`table_config`系统表中每个表的`durability`属性或者直接使用`reconfigure`来设定表.
    默认情况下此值为`hard`当写操作数据落盘之后才返回写确认. 
    您也可以将此值修改为`soft`来设置当写操作还没落盘还在内存中时就返回写确认.
* __Durability__: 设定每个查询的读取方式. 其值有3个值:
    * single(默认): 返回来自主副本的数据.
    * majority: 返回大多数副本已落盘的数据(速度最慢但是一致性最高).
    * outdated: 返回任意一个副本的数据(速度最快但是一致性最低).

## 原子操作

如果您在RethinkDB中使用以下设置, 那么能保证原子操作每个记录.

* `write_acks`: `majority`
* `durability`: `hard`
* `read_mode`: `majority`

这意味着每个读操作只能读取到成功写入之后的数据, 并且不会读取到正在写入与写入失败的数据.

The linearizability guarantee is for atomic operations, not for queries. 
一个RethinkDB查询可能并不是原子操作例如:
```javascript
r.table("foo").get("bar").eq(r.table("foo").get("bar")).run(conn, callback);
```
这个查询可能会返回`false`, 其中[get](https://www.rethinkdb.com/api/javascript/get/)操作为原子操作但整个查询不是原子操作.

如果您想使用原子操作来读取并更新记录可以使用[update](https://www.rethinkdb.com/api/javascript/update/)或[replace](https://www.rethinkdb.com/api/javascript/replace/)命令.
```javascript
r.table("foo").get(id).update({hits: r.row("hits") + 1}).run(conn, callback);
```
也可以按照此方法来完成CAS操作, 以下查询会原子检查`check`字段的值是否为`old_value`, 如果是的话则更新为`new_value`:
```javascript
r.table("foo").get(register_id).update({
    check: r.branch(r.row("check").eq(old_value), new_value, r.row("check"))
}).run(conn, callback);
```

<div class="infobox "><p>RethinkDB在操作多个键时均为非原子操作, 所以RethinkDB不能被称为ACID数据库.</p></div>

Currently, filter, get_all and similar operations execute as separate operations from update and other mutation operations. Therefore, the following is not a correct implementation of a check-and-set register, since filter and update will not execute in one atomic operation:

```javascript
r.table("foo").filter({
    id: register_id, foo: old_val
}).update({foo: new_val}).run(conn, callback);

table.filter({id: register_id, foo: old_val}).update({foo: new_val})
```

## 可用性问题

集群内节点发生宕机或网络错误, 此时可投票副本数量只需要大于总投票副本数的一半则这个表可以继续提供服务.
如果一半或更多的的副本失效则这个表无法继续提供服务.

当集群内的主副本宕机或其他原因失效, 则会引发集群内重新选举主副本. 
当选举完毕后新的主副本实例节点名会被添加至系统表`table_config`的`primary_replica`字段, 此时上一个主副本实例节点名依然会被保留.
如果当上一个主副本实例恢复连接则会被重新钦定为主副本.

> RethinkDB中触发主副本选举会引发短暂表不可用.
>
> 如您想调整表配置例如: 调整分片数量, 调整分片平衡, 那么在调整期间这个表也会在短时间内无法提供服务.

如果集群内有一半或更多的的副本失效, 然而您想让这个表强制上线可以使用[reconfigure](https://www.rethinkdb.com/api/javascript/reconfigure)命令的`emergency_repair`选项来对表进行调整.
如果想了解更多请查阅`reconfigure`命令文档.

除了上述使用[reconfigure](https://www.rethinkdb.com/api/javascript/reconfigure)命令来使表重新上线外您还可以在查询时候使用`outdated`模式进行查询. 即使只有一个副本可用使用`outdated`模式也能够成功查询数据, 不过这样可能会导致数据一致性问题.

<div class="infobox "><p><strong>表副本是否参与主副本选举问题?</strong> 
默认情况下全部的表副本都会参与主副本选举投票, 这同时也意味着有些操作(例如写操作)需要大部分副本响应时其响应速度会取决于您节点之间的网络延时.
如果您节点之间网络延时很高, 您可以将网络延迟低的一组设置为投票副本, 网络延时高的节点设置为非投票副本, 这样就可以加快响应速度了
, 不过带来的代价可能会造成读取时数据一致性问题. 您可以使用`reconfigure`来对表是否参与投票进行设置.
</p>
</div>

## 数据一致性与性能

RethinkDB中的大多数设置是倾向于数据一致性高于性能的, 不过除了一个读取设置: `read_mode`, `read_mode`被默认设置为`single`而不是`majority`.
当使用`majority`作为读取设置时, 读取操作会请求节点内的全部副本以便保证数据一致性. 不过带来的副作用就是读取操作耗时会增加.

大多数情况下`single`与`majority`返回的数据是一样的, 但是当集群内出现网络分裂或者其他情况`single`可能会读取到与主副本不一致的数据.
还有情况就是`single`会可能读取到一个正在回滚操作的数据(例如写操作需要3个副本确认, 但是其中有1个副本无法确认, 其他2个副本就需要回滚).

写操作中也有一个类似的选项: `write_acks`. 当`write_acks`的值为`soft`时, 写操作只要有一个副本返回成功则整个操作返回成功.
不过在遇到网络分裂或者其他情况时使用`soft`可能会导致特殊情况恢复后数据回滚造成数据丢失.

> `write_acks`与`durability`并不会改变RethinkDB数据写入方式, 只会改变在哪个阶段返回写入成功.

当`read_mode`设置为`outdated`时即使在正常情况下也会读取到过时的数据.
在出现网络分裂或者其他情况`outdated`可能读取到过时非常久的数据.

`outdated`与`single`的区别就在于`outdated`牺牲了数据一致性提高了可用性, 性能, 响应延时.

## 其他

当您对表开启`emergency_repair`(紧急维修模式)选项后会关闭RethinkDB针对表正常保护机制, 如果操作不当可能会导致数据丢失.

当写入操作确定写入失败时, 任何读取设置都不会读取到写入失败的数据.
当写入操作还正在确认是否失败时, 使用`single`或`outdated`可能会读取到正在确认的数据.
一般在集群内节点出现问题时的首次查询可能会遇到__正在确认是否失败__较长时间.
同时在集群内出现网络分裂时可能会遇到写入数据被回滚消失的问题.



