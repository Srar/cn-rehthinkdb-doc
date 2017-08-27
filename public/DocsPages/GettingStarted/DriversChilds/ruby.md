# 安装RethinkDB库 #

通过gem安装RethinkDB库:

```bash
$ sudo gem install rethinkdb
```

# 使用 #

```javascript
$ irb
require 'rubygems'
require 'rethinkdb'
include RethinkDB::Shortcuts
r.connect(:host => 'localhost', :port => 28015).repl
r.db('test').table_create('tv_shows').run
r.table('tv_shows').insert({ 'name'=>'Star Trek TNG' }).run
```

# 下一步 #

<div class="infobox ">
    <p>阅读[10分钟快速了解](https://www.rethinkdb.com/docs/guide/ruby/)来知道如何使用RethinkDB.</p>
</div>