# 安装RethinkDB库 #

通过pip安装RethinkDB库:

```bash
$ sudo pip install rethinkdb
```

> 版本为1.14的依赖库同时支持Python2,3. 版本为1.13或更低仅支持Python2.

# 使用 #

```javascript
$ python
import rethinkdb as r
r.connect('localhost', 28015).repl()
r.db('test').table_create('tv_shows').run()
r.table('tv_shows').insert({ 'name': 'Star Trek TNG' }).run()
```

# 下一步 #

<div class="infobox ">
    <p>阅读[10分钟快速了解](https://www.rethinkdb.com/docs/guide/python/)来知道如何使用RethinkDB.</p>
</div>