# 访问嵌套字段

<p>
    <img src="/DocsPages/images/nested_fields.png" class="api_command_illustration">
</p>

每条记录都是一个JSON对象, 对象内key对应着value, value可以是单个值, 也可以是一个数组, 或者其他对象.
当value包含其他字段时, 我们称这些为嵌套字段.

考虑到每个用户应该有联系方式和短信:

```js
{
	id: 10001,
	name: "Bob Smith",
	contact: {
		phone: {
			work: "408-555-1212",
			home: "408-555-1213",
			cell: "408-555-1214"
		},
		email: {
			work: "bob@smith.com",
			home: "bobsmith@gmail.com",
			other: "bobbys@moosecall.net"
		},
		im: {
			skype: "Bob Smith",
			aim: "bobmoose",
			icq: "nobodyremembersicqnumbers"
		}
	},
	notes: [
		{
			date: r.time(2014,1,1,'Z'),
			from: "John Doe",
			subject: "My name is even more boring than Bob's"
		},
		{
			date: r.time(2014,2,2,'Z'),
			from: "Bob Smith Sr",
			subject: "Happy Second of February"
		}
	]
}
```
这时`contact`就是嵌套的, 在文件系统里路径会标识成这样:
> contact → phone → work → 408-555-1212

您可以连续使用`()`来访问嵌套的字段. 列如:

```js
> r.table('users').get(10001)('contact')('phone')('work').run(conn, callback)
// 结果
"408-555-1212"
```

您还可以使用类似JSON格式的方法来访问:

```js
> r.table('users').get(10001).pluck(
	{contact: {phone: "work"}}
).run(conn, callback)
// 结果
{
	"contact": {
		"phone": {
			"work": "408-555-1212"
		}
	}
}
```

在上面列子中只获取了一个值你会觉得这样用起来不是特别高端, 但是你可以这样来获取多个值, 
假设我想获取`cell`和`work`号码, 但不需要`home`,这时候就可以这样玩了.

```js
> r.table('users').get(10001).pluck(
	{contact: {phone: ["work", "cell"]}}
).run(conn, callback)
// 结果
{
	"contact": {
		"phone": {
			"cell": "408-555-1214",
			"work": "408-555-1212"
		}
	}
}
```

或者Bob的work号码和Skype帐号

```js
> r.table('users').get(10001).pluck(
	{contact: [{phone: 'work', im: 'skype'}]}
).run(conn, callback)
// 结果
{
	"contact": {
		"im": {
			"skype": "Bob Smith"
		},
		"phone": {
			"work": "408-555-1212"
		}
	}
}
```

还能只需要`notes`的`date`和`from`.

```js
> r.table('users').get(10001).pluck(
	{notes: ['date', 'from']}
).run(conn, callback)
// 结果
{
	"notes": [
		{
			"date": Wed Jan 01 2014 00:00:00 GMT+00:00 ,
			"from":  "John Doe"
		},
		{
			"date": Sun Feb 02 2014 00:00:00 GMT+00:00 ,
			"from":  "Bob Smith Sr."
		}
	]
}
```

如果你访问了一个不存在的字段, 那么会返回空对象或者空数组

```js
> r.table('users').get(10001).pluck(
	{contact: [{phone: 'work', im: 'msn'}]}
).run(conn, callback)
// 结果
{
	"contact": {
		"im": { },
		"phone": {
			"work": "408-555-1212"
		}
	}
}
```

需要注意如果您想从关于Bob的10条`notes`记录中读取`subject`字段, 不过其中7条记录没有这个字段. 但是RethinkDB依然会将其返回为`{}`. 
其他包含`subject`3条的记录仍会返回`{subject: <text>}`.

Also, another caveat: the nested field syntax doesn't guarantee identical schemas between documents that it returns. It's possible to describe a path that matches objects that have different schema, as seen in this simple example.

```js
> r([
    {
        a: {
            b: 1,
            c: 2
        }
    },
    {
        a: [
            {
                b: 1,
                c: 2
            }
        ]
    }
]).pluck({a: {b: true}}).run(conn, callback)
// result passed to callback
[
    {
        "a": {
            "b": 1
        }
    },
    {
        "a": [
            {
                "b": 1
            }
        ]
    }
]
```