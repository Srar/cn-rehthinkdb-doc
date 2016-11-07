# 存储二进制对象
RethinkDB原生支持二进制对象, 可以让您使用ReQL直接将二进制数据或文件存储进数据库. 
RehinkDB库会自动处理在ReQL类型与NodeJS Buffers中转换.

> 二进制数据文件适用于无法被UTF8字符串可靠存储的数据，列如文件。如果您的数据可以使用字符串进行存储那么我们还是建议您使用字符串存储.

## 存储上传文件至数据库
常见的网站中都会允许用户上传文件, 列如头像. 使用RethinkDB你可以直接存储进数据库.
```
var fs = require('fs');

function saveFile(filePath, saveName, userId, callback) {
  fs.readFile(filePath, function(err, contents) {
    if (err) return callback(err);
    r.table('files').insert({
      userId: userId,
      filename: saveName,
      file: contents // 由于contents是buffer, 所以我们不需要使用`r.binary`
    }).run(conn, callback)
  }
}
```
`saveFile`方法中我们基于文件路径来上传文件(这些文件也有可能会在临时目录，这要取决于http上传文件处理的中间件)。
并以`saveName`作为文件名和用户ID来区分是那个用户上传的.
然后使用[binary](https://www.rethinkdb.com/api/javascript/binary)命令吧二进制文件存储进`file`字段
```
function getUserFileIDs(userId, callback) {
  r.table('files').filter({userId: userId}).pluck('id', 'filename').run(conn, callback)
}

function getFile(fileId, callback) {
  r.table('files').get(fileId).pluck('file'​, 'filename').run(conn, callback)
}
```
然后我们定义两个function来获取二进制文件: 第一个是查询出用户上传的全部文件，第二个是根据文件主键来获取文件。同样这里我们也没有使用`binary`。
RethinkDB库会将`file`字段以适当的类型放置在会返回您的对象中。

## 存储用户头像
下面有个更interesting的例子，给用户账户添加[Gravatar](https://en.gravatar.com/site/implement/images/)头像.
我们可以通过[http](https://www.rethinkdb.com/api/javascript/http)来获取.:
```
// https://www.npmjs.org/package/MD5
var md5 = require('MD5');

function addGravatar(userId, callback) {
  r.table('users').get(userId)('email').​run(conn, function (err, email) {
    if (err) return callback(err);
    hash = md5(email);
    gravatarUrl = 'http://gravatar.com/avatar/' + hash + '?d=retro';
    r.table('users').get(userId).update({
      gravatar: r.http(gravatarUrl, {resultFormat: 'binary'})
    }).run(conn, callback)
  }
}
```
`r.binary`在哪？你不必关系，因为在`r.http`中我们使用了`{resultFormat: 'binary'}`选项，它就会直接返回`binary`.
(如果http服务器mime设置正确，你甚至可以不加`{resultFormat: 'binary'}`选项. RethinkDB会自动根据mime判断类型!)