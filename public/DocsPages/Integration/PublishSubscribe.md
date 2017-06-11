# 通过RethinkDB订阅发布

[订阅发布模式](https://zh.wikipedia.org/wiki/%E5%8F%91%E5%B8%83/%E8%AE%A2%E9%98%85)
是对于项目一种解耦方式. RethinkDB允许您通过[changefeeds](/docs/2-6)来构建与数据库数据交换的订阅发布.

我们目前做了一个小型订阅发布模式JavaScript库: [repubsub](https://github.com/rethinkdb/example-pubsub/tree/master/javascript)

<div class="infobox "><p>If you haven’t read the <a href="/docs/changefeeds/javascript/">article on changefeeds</a> yet, start there! You can subscribe to notifications on tables and queries with changefeeds alone, without using publish-subscribe. If you’d like to see how to implement a message queue with topics using changefeeds, read on!</p>
</div>

这篇文章将会为您解释如何使用repubsub同时how it’s implemented on top of changefeeds. 
如果您的项目需要异步广播通知, this may be a good fit.

## 订阅发布
There are different publish-subscribe variations, so here we’ll describe the type using a central topic exchange. In this model, publishers connect to the central exchange and broadcast a message with a given topic. When subscribers connect, they notify the exchange about what kinds of messages they’re interested in. The exchange is then responsible for filtering messages.

## 使用repubsub
Repubsub基于RethinkDB实现了一个简单的订阅发布, 其使用了ReQL作为过滤正是因为此大多数编程语言都可以使用. 
这比传统的消息队列提供了更多的灵活性。

repubsub中有3个类, 其作用为:
* `Exchange`: 由订阅者与发布者创建的交换数据类. 发布者可以将消息发送至Exchange, 同时订阅者可以监听Exchange来获取消息.
* `Topic`: 由发布者使用. 其包含了一些有关于消息的meta-data的键.
* `Queue`: 由订阅者(消费者)使用. 其包含两个用途:
    * 缓存还没有被订阅者处理的消息(服务端处理)
    * 通过`Topic`来过滤从`Exchange`的消息(服务端处理)

导入repubsub库并创建一个连接至exchange:
```javascript
var repubsub = require('repubsub');

var exchange = new repubsub.Exchange('pubsub_demo',
    {db: 'repubsub', host: 'localhost', port: 28015});
```

### 使用正则表达式来订阅
最简单的情况是发布具有文本的消息, 这让我们可以使用正则表达式进行过滤.

发布一个消息至exchange来创建topic:
```javascript
var topic = exchange.topic('fights.superheroes.batman');
```

现在我们可以发布任意JSON文档至topic:
```javascript
topic.publish({
    opponent: 'Joker',
    victory: true,
});
```

在需要订阅的项目中创建一个队列来接受并缓存消息. 队列的使用ReQL方法作为传入的参数.
这类似于您使用[filter](https://www.rethinkdb.com/api/javascript/filter). 
在此我们将订阅关于superhero fights的全部消息:

```javascript
function filterFunc(topic){
    return topic.match('fights\\.superheroes.*')
};
var queue = exchange.queue(filterFunc);
```

之后使用`queue.subscribe()`来监听消息:
```javascript
queue.subscribe(function(topic, payload){
    console.log('I got the topic:', topic)
    console.log('With the message:', payload)
}
```

### 使用标签来订阅
您同样可以使用标签来过滤消息. 我们将标签放入文本中并构建一个正则表达式来匹配我们想要的标签文本,
不过ReQL很吼已经想到这个问题了, 您可以直接将topic变成一个json数组, 并使用ReQL的[contains](https://www.rethinkdb.com/api/javascript/contains)方法来过滤.

假设我们想发送一个Batman与Joker正在干架的信息, 我们会将信息带上`#superhero`, `#fight`与`#supervillain`标签:

```javascript
var topic = exchange.topic(['superhero', 'fight', 'supervillain'])
topic.publish({
    interactionType: 'tussle',
    participants: ['Batman', 'Joker'],
})
```

订阅者订阅时候提供相应的标签就能接受到相应标签的信息:

```javascript
function filterFunc(tags){
    return tags.contains('fight', 'superhero');
}

exchange.queue(filterFunc).subscribe(function(topic, payload){
    console.log(payload.participants[0],
        'got in a fight with',
        payload.participants[1]);
}
```
由于订阅者只订阅了`fight`与`superhero`标签, 所以`supervillain`标签的信息将不会被接收到.

## Subscribing to hierarchical topics
最后一个示例我们将使用一个object作为topics. 
使用object作为topics允许我们对发布的信息带有分级结构, rather than keeping them in a flat structure like an array. This provides us with maximum flexibility in message routing.

假如我们想发布Batman,Superman与Joker的合作:

```javascript
var topic = exchange.topic({
    teamup: {
        superheroes: ['Batman', 'Superman'],
        supervillains: ['Joker']
    },
    surprising: true
});

topic.publish('Today Batman, Superman and the Joker teamed up ' +
              'in a surprising turn of events...');
```

There are multiple subscriptions we could have set up that would receive this news:

```javascript
// 获取有关于surprising的消息
var isSurprising = function(topic){return topic('surprising')};

// Get all messages involving a teamup or a fight
var isTeamOrFight = function(topic){return topic('teamup').or(topic('fight'))};

// Get all messages talking about a teamup with Batman
var aboutBatman = function(topic){
    return topic('teamup')('superheroes').contains('Batman');
}
```

## 尝试repubsub demo
示例文档包含[演示脚本](https://github.com/rethinkdb/example-pubsub/blob/master/javascript/demo.js'), 并带有上述三种订阅发布模式. 该脚本同时实现每个模式类型的发布者和订阅者. 您可以使用此脚本来尝试多个发布者和多个订阅者来测试它并了解工作原理.

您可以将演示脚本运行在不同的终端内, 这样又便于很好的查看输出.

## repubsub内部是如何实现的?
在文章开头讲述过repubsub是基于RethinkDB changefeeds来构建的, 其内部大致是这样:
* 每个exchange是RethinkDB的一个表
* 每个记录包含4个字段: `id`, `topic`, `payload`, `update_on`.
    * 当消息被发送后, repubsub会将`update_on`字段值更新为`r.now`.
* 当信息被发送至`topic`时会查找相同的记录如果有相同记录则覆盖, 没有则新建.
* 订阅者在`Exchange`表上创建changefeed来用作过滤以及查询.

需要注意的是我们并不用关心记录是如何存储在表内的. 我们只需要创建以及更新文档.because that forces RethinkDB to create a change notification. These change notifications are the messages we want to send to subscribers. Ultimately, the table ends up with lots of documents that have whatever the last message happened to be inside them. But at no point do we read those documents directly as a subscriber. This is also why we update the updated_on field, so that even if the document’s payload hasn’t changed, the document as a whole will change and a notification will be generated.

The entire query on the exchange is:

```javascript
// this.table is the Exchange's underlying table
// filterFunc is the function passed in by the subscriber
this.table.changes()('new_val').filter(function(row){
    return filterFunc(row('topic'));
};
```
This query pulls out `new_val` from the changefeed, and passes just the topic field from the new value down to the subscriber’s function.
```javascript
// iterFunc is the per-message callback supplied by the client
return this.assertTable().then(function(){
    return this.fullQuery(filterFunc).run(this.conn);
}).then(function(cursor){
    cursor.each(function(err, message){
        iterFunc(message.topic, message.payload);
    });
});
```