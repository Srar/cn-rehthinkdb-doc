# 安装RethinkDB库 #

_要求:_ RethinkDB库安装要求Node.js版本 >= 0.10.0.

通过npm安装RethinkDB库:

```bash
$ npm install rethinkdb
```

# 使用 #

```javascript
$ node
r = require('rethinkdb')
r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
  if(err) throw err;
  r.db('test').tableCreate('tv_shows').run(conn, function(err, res) {
    if(err) throw err;
    console.log(res);
    r.table('tv_shows').insert({ name: 'Star Trek TNG' }).run(conn, function(err, res)
    {
      if(err) throw err;
      console.log(res);
    });
  });
});
```

# 下一步 #

<div class="infobox ">
    <p>阅读[10分钟快速了解](/#/Docs/2-0)来知道如何使用RethinkDB.</p>
</div>