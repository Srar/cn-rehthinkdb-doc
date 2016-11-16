# 用户与用户权限
RethinkDB基于___用户___, ___用户权限___, ___范围___来控制对集群的访问. 
将上述3个配合在一起您就能控制表级别写入, 访问与管理.

# 用户
RethinkDB中的用户与大多数其他数据库系统中的用户相似;
数据库管理员可以具有用户帐户，并且可以向应用程序给予访问帐户.

创建一个用户需要使用`insert`命令往`users`系统表内插入一条记录. 其中`id`字段为用户名`password`字段为密码.

```javascript
r.db('rethinkdb').table('users').insert({id: 'bob', password: 'secret'})
```

如果您查询这条记录则会返回

```json
{
    "id": "bob",
    "password": true
}
```

`password`字段是一个bool类型，其表达了这个用户是否设置了密码.

您也可以通过`update`字段来更新密码, 或者将其设置为`false`移除密码.

```javascript
r.db('rethinkdb').table('users').get('bob').update({password: false})
```
您还需要知道的是：当用户创建好后用户名无法修改，但是您可以通过`delete`命令来删除用户然后新建一个.

## 密码hash迭代
默认情况下，RethinkDB库与RethinkDB实例之间握手期间会使用4096次迭代来hash密码. 
您也可以通过`{password: "password", iterations: 4096}`方式来指定迭代次数. 比如我只需要迭代1024次, 我就可以这样设置:

```javascript
r.db('rethinkdb').table('users').insert({id: 'bob', password: {password: 'secret', iterations: 1024}})
```

由于迭代次数是存储在`password`字段中的，这意味着您设定好迭代次数后将无法读取迭代次数.

迭代的值是针对暴力破解的性能与安全性之间的权衡. 如果连接实例较慢时可以考虑降低迭代次数但是会使安全性下降. 
如提高迭代次数可以提高暴力破解的难度，但同时会增加连接实例时候的CPU占用.

## 管理员用户
当一个新RethinkDB集群被创建时候会默认带一个`admin`用户, 这个用户有对集群全范围的管理与读写权限, 并且这个用户无法被删除.
默认情况下`admin`用户没有密码. 您可以修改`admin`用户的记录来修改密码, 或者在RethinkDB启动参数加上`--initial-password`参数.

Web管理界面由如使用`admin`用户，但是Web管理界面可以在任何情况下无需密码来管理实例.
还有一点就是访问Web管理界面没有密码保护，您可以用过限制IP地址来对其保护. 或者在启动参数加上`--bind-http`来限制Web管理界面绑定的IP.
或者可以通过Nginx来反向代理鉴权.

如果您忘记了admin就可以通过Web管理界面的Data Explorer来更新记录.

# 权限
可以授予用户四种不同的权限:
* `read` 允许读取表
* `write`允许修改表: 插入，替换，更新，删除
* `connect` 允许用户使用[http](https://www.rethinkdb.com/api/javascript/http)对HTTP服务进行连接
(提供这个权限限制的原因是因为安全性，防止来绕过防火墙限制)
* `config` 在特定的范围内允许用户管理
    * ___table___ 范围允许创建或者删除表索引, 更改表配置(`reconfigure`与`rebalance`命令)
    * ___database___ 包括___table___范围全部权限，并另有创建或删除表权限
    * ___global___ 包括___database___范围全部权限，并另有创建或者删除数据库权限.
    (不管如何, 用户必须有`config`权限才能删除表, 如果在表范围设置那么会覆盖继承自global/database的权限那么将无法删除表. 下面将会讲)

权限信息存储在`permissions`系统表内，您可以通过修改记录的方式来修改权限. 
或者使用更加方便的[grant](https://www.rethinkdb.com/docs/permissions-and-accounts/#the-grant-command)命令来管理权限.

# 范围
通过`read`, `write`与`config`命令在3个权限范围上限制就达到细粒度到粗粒度的控制
* table (仅影响表)
* database (影响数据库和其中的表)
* global (影响所有数据库和其中的表)

权限范围较小的权限会覆盖权限范围较大的权限：先假设这个用户可以访问`field_notes`数据库, 
无法写入但是可以读取`calendar`表, 但是`supervisor_only`表无法读取也无法写入.
```
User: notesapp
    database "field_notes" { read: true, write: true, config: false }
        table "calendar" { write: false }
        table "supervisor_only" { read: false, write: false }
```
`calendar`表继承了数据库的`read: true`权限，然而`write: false`覆盖了继承自数据库的写权限. 
`supervisor_only`则也覆盖了继承自数据库的权限改变为禁止读与禁止写. 
`notesapp`用户具有读写`field_notes`数据库全部表权限但是无法创建或者删除索引并且无法对表进行配置.

# grant命令
通过[grant](https://www.rethinkdb.com/api/javascript/grant)命令可以赋予或者删除用户权限.
权限范围可以用过链式调用方式来区分: `db`(database范围), `table`(table范围), 直接调用(global范围).
```
r.grant("user", {permissions}) → object
table.grant("user", {permissions}) → object
db.grant("user", {permissions}) → object
```

假设要为Bob用户赋予上文例子中的权限数据, 您执行以下ReQL命令:

```javascript
// database范围
r.db('field_notes').grant('bob', {read: true, write: true, config: false});

// table范围
r.db('field_notes').table('calendar').grant('bob', {write: false});
r.db('field_notes').table('supervisor_only').grant('bob', {read: false, write: false});
```

# 了解更多
`grant`命令API文档:
* [javascript](https://www.rethinkdb.com/api/javascript/grant)
* [python](https://www.rethinkdb.com/api/python/grant)
* [ruby](https://www.rethinkdb.com/api/ruby/grant)
* [java](https://www.rethinkdb.com/api/java/grant)

其他:
* [System tables](#)
* [Securing your cluster](#)