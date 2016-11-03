# 外部访问API

RethinkDB提供[r.http](https://www.rethinkdb.com/api/javascript/http/)可以从数据库直接访问外部。
由于许多API都接受并返回json，无论是交互交互或在运行中的程序用，RethinkDB都是处理API数据进行操作和分析的便捷平台。

## 基本使用
来试一个非常简单的功能 - 访问网站. 把下面命令输入WebUI的`Data Explorer`并点击`run`(您也可以在应用程序里那么干)
```
r.http('www.baidu.com')
```
`r.http`命令会让数据库直接给`www.baidu.com`发送请求并返回html源码

## 访问JSON API
现在来访问一个实际的JSON API。 在例子中我们会使用Github的API来告诉我们那些大触关注了RethinkDB
```
r.http('https://api.github.com/repos/rethinkdb/rethinkdb/stargazers')
```
这个查询调用了Github API并且API返回了一个<JSON></JSON>数组。 
由于RethinkDB原生就可以操作JSON所以您可以直接使用ReQL对`r.http`进行操作，就像在表里查询一样。

假设我想查看Github API返回的数据数量
```
r.http('https://api.github.com/repos/rethinkdb/rethinkdb/stargazers').count()
```
或者我们只需要 username 和 id, 并对id进行排序
```
r.http('https://api.github.com/repos/rethinkdb/rethinkdb/stargazers')
 .pluck('login', 'id').orderBy('id')
```

## 存储并enriching API数据
由于你可能想对数据进行更多才做，那么你最好把API数据导入进数据库。那么我们来创建一个`stargazers`表将关注的人存储进去。
```
r.tableCreate('stargazers');
r.table('stargazers').insert(
  r.http('https://api.github.com/repos/rethinkdb/rethinkdb/stargazers'));
```
现在我们想看看那些关注RethinkDB项目的人影响力比较高(被关注的人比较多)。
有个小问题GitHub API不会直接告诉您用户的详细信息，包括他们的被关注数。但是刚刚API会其中会返回一个`url`告诉我们去那找用户的详细信息，包括被关注数量。

现在我们来用其中的`url`来更新RethinkDB关注用户的详细信息:
```
r.table('stargazers').update(r.http(r.row('url')), {nonAtomic: true})
```
这个update命令会访问用户详细信息的url然后合并至刚刚的表中!

现在我们就可以按照被关注的人数来进行排序, 这样就可以知道那些大触关注了RethinkDB项目了
```
r.table('stargazers').orderBy(r.desc('followers'))
```

## 分页

上面API仅返回了30个RethinkDB关注者，然而RethinkDB关注着有上万个。对于大量数据很多网站都会使用分页来分批返回数据Github也一样。
这时候就要说`r.http`的分页功能了
```
r.http('https://api.github.com/repos/rethinkdb/rethinkdb/stargazers',
       { page: 'link-next', pageLimit: 10 })
```
`page`参数代表该分页是如何分页的，`page-limit`参数代表你想获取到多少页。点击[这里](https://www.rethinkdb.com/api/javascript/http/)了解更多细节

当使用分页时，`r.http`只会返回游标，当游标快到末尾时RethinkDB才会去请求下一页避免并发访问API。

## 身份验证

大多数API会使用auth来进行认证，同样`r.http`支持auth，列如下面的Github Api。
```
r.http('https://api.github.com/users/coffeemug', {
       auth: {
           user: GITHUB_TOKEN,
           pass: 'x-oauth-basic'
       }
})
```
## 了解更多

点击已下链接来了解ReQL或者`r.http`

* [r.http](https://www.rethinkdb.com/api/javascript/http) API说明
* [了解ReQL](/docs/2-1)
* [https://www.rethinkdb.com/blog/lambda-functions/](https://www.rethinkdb.com/blog/lambda-functions/)


