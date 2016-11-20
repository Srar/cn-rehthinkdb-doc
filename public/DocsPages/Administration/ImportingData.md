# 导入数据

<p>
    <img src="/DocsPages/images/importing_data.png" class="api_command_illustration">
</p>

RethinkDB提供了`import`命令来导入已存在的数据至数据库中.
它可以读取json文件与逗号或其他符号分割的csv文件.`import`导入工具会使用`admin`账户导入数据.

如您想从SQL数据库中导出JSON的话, 我还是建议您自己写一个脚本或者使用[mysql2xxxx](https://github.com/seamusabshere/mysql2xxxx)

`import`命令完整语法是如下:

___从文件夹导入___(仅支持使用`rethinkdb export`从RethinkDB导出的数据再导入数据库)
```
rethinkdb import -d DIR [-c HOST:PORT] [--force] [-p]
  [--password-file FILE] [-i (DB | DB.TABLE)] [--clients NUM]
  [--shards NUM_SHARDS] [--replicas NUM_REPLICAS]
```
___从文件导入___
```
rethinkdb import -f FILE --table DB.TABLE [-c HOST:PORT] [--force]
  [-p] [--password-file FILE] [--clients NUM] [--format (csv | json)]
  [--pkey PRIMARY_KEY] [--shards NUM_SHARDS] [--replicas NUM_REPLICAS]
  [--delimiter CHARACTER] [--custom-header FIELD,FIELD... [--no-header]]
```

参数说明:
* `-f`: 需要导入的文件.
* `--table`: 导入到那个表.
* `--format`: CSV或JSON(默认JSON).
* `-c`: 连接至实例的IP与端口.
* `-p`, `--password`: 如果实例设置了`admin`密码，您需要提供`admin`密码.
* `--password-file`: 从文件中读取`admin`密码.
* `--tls-cert`: 使用tls证书来加密到实例的通讯(详细见[Securing the cluster](#)).
* `--clients`: 并发连接的数量(默认8).
* `--force`: 如果表存在依然导入数据.
* `--fields`: 导入特定字段.
* `--no-header`: 表示CSV第一行不是header.
* `--custom-header`: 表示CSV第一行是header.

这些选项仅适用于文件导入数据, 如果您想了解其他导入命令可以使用`rethinkdb help import`来查看完整参数列表.

导入`users.json`文件至`test.users`表:
```
rethinkdb import -f users.json --table test.users
```
如果是CSV文件, 您可以这样操作:
```
rethinkdb import -f users.csv --format csv --table test.users
```

默认情况下`import`命令会连接到`localhost:28015`. 您可以使用`-c`参数来指定连接的实例.
```
rethinkdb import -f crew.json --table discovery.crew -c hal:2001
```

如果集群开启了鉴权, 您可以使用`-p`来后续输入密码, 或者使用`--password-file`从文件中读取密码(密码文件必须为文本文件, 并且密码在第一行).
```
rethinkdb import -f crew.json --table discovery.crew -c hal:2001 -p
```

可以使用`--pkey`来指定主键的字段名:
```
rethinkdb import -f heroes.json --table marvel.heroes --pkey name
```

RethinkDB中JSON文档兼容性比CSV文件不知道高到哪里去了.
如果要从CSV文件导入, 则应包含带有字段名称的标题行, 或使用`--no-header`选项和`--custom-header`选项来指定名称.
```
rethinkdb import -f users.csv --format csv --table test.users --no-header \
    --custom-header id,username,email,password
```
CSV文件字段分割默认是用过逗号分割的, 您也可以使用`--delimiter`来指定分割的字符. 使用制表符分割的文件您可以这样指定`--delimiter '\t'`.

从CSV文件导入的数据会全部已字符串导入, 如果您需要在导入后对这些字符串数字转换为数值类型请在`Data Explorer`中运行类型转换查询:

```javascript
r.table('tablename').update(function(doc) {
    return doc.merge({
        field1: doc('field1').coerceTo('number'),
        field2: doc('field2').coerceTo('number')
    })
});
```

RethinkDB接受两种格式的JSON文件:
* JSON数组: `[ { field: "value" }, { field: "value"}, ... `
* 以空格分隔的JSON对象: `{ field: "value" } { field: "value" } `

其中第二种不是有效的JSON格式, 但是RethinkDB支持第二种格式的方式导入.

如果您想了解其他导入命令可以使用`rethinkdb help import`来查看完整参数列表.
