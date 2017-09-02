# RethinkDB集成RabbitMQ

RethinkDB提供了[changefeeds](/#/Docs/2-6), changefeeds允许您订阅表中记录更变的事件, 当表记录被更新时, RethinkDB会主动推送更变消息至您的程序.

RabbitMQ 是一个消息代理.它的核心原理非常简单: 接收和发送消息.你可以把它想像成一个邮局: 你把信件放入邮筒, 邮递员就会把信件投递到你的收件人处.在这个比喻中, RabbitMQ 就扮演着邮筒、邮局以及邮递员的角色.
本文章中将介绍如何结合RabbitMQ与RethinkDB来允许订阅者订阅它们所感兴趣的内容并忽略掉省下内容.

<div class="infobox "><p><strong>开始之前您可能需要阅读:</strong></p>

<ul>
  <li>RethinkDB<a href="/docs/quickstart/#/Docs/1-1">30秒快速入门.</a></li>
  <li><a href="/#/Docs/1-0">安装RethinkDB</a>至您的系统上.</li>
  <li>安装NodeJS RabbitMQ库: <a href="http://www.squaremobius.net/amqp.node/">amqplib</a>.</li>
</ul>
</div>

## 推送更变至RabbitMQ

先让我们写一段代码, 监听RethinkDB数据库内的更变, 然后将更变推送至RabbitMQ.

第一步, 我们需要创建一个连接并连接至RethinkDB服务器:
```javascript
const r = require('rethinkdb');
const amqp = require('amqplib');

var rethinkConn = null;
var rabbitConn = null;
var channel = null;

var promise = r.connect({host: 'localhost', port: 28015}).then(function(conn){
   rethinkConn = conn;
})
```

第二部使用amqplib连接至RabbitMQ:
```javascript
promise = promise.then(function(){
    return amqp.connect('amqp://localhost:5672');
}).then(function(conn){
    rabbitConn = conn;
    return rabbitConn.createChannel();
}).then(function(ch){
    channel = ch;
})
```
RabbitMQ使用使用多路复用, 所以只需要单个TCP连接即可.
接下来我们将声明一个topic exchange, 来允许让我们可以把更变消息发送至它:
```javascript
promise = promise.then(function(){
    return channel.assertExchange('rethinkdb', 'topic', {durable: false});
})
```
这会声明一个名字为"rethinkdb"的非持久化(重启RabbitMQ后会丢失) topic exchange.
如果这个exchange不存在则会自动创建.如果这个exchange已经存在但是属性不相同则会发生异常.

本文中我们假设RethinkDB内有个叫`change_example`的数据库, 数据库内有个`mytable`表.
同时我们订阅这个表的更变消息:
```javascript
var tableChanges = r.db('change_example').table('mytable').changes();
```

`changes`会已以下规则返回数据:
* 如果`old_val`值为`null`, 说明`new_val`内包含一个新创建的记录.
* 如果`new_val`值为`null`, 说明`old_val`内包含一个已被删除的记录.
* 如果`old_val`与`new_val`都存在, 那么`old_val`是更新前的记录数据, `new_val`是更新后的记录数据.

现在我们写一段当更变事件到达时候, 把更变的消息推送到Rabbitmq中:
```javascript
promise = promise.then(function(){
    return tableChanges.run(rethinkConn);
}).then(function(changeCursor){
    changeCursor.each(function(err, change){
        var routingKey = 'mytable.' + typeOfChange(change);
        var payload = new Buffer(JSON.stringify(change));
        channel.publish('rethinkdb', routingKey, payload);
    })
})
```
其中`routingKey`变量是我们发送的topic. 在这个例子中我们有3个topic: `mytable.create`, `mytable.update`, `mytable.delete`.
每个topic只包含与其相符的changes. 在例子代码中不包含`typeOfChange`方法, 不过您可以根据上面的changes返回规则来自行实现一个.

__接受来自RabbitMQ的消息__

连接至RabbitMQ注册感兴趣的topic, 当接受到时topic消息后再做响应处理.

开始之前我们需要先连接至RabbitMQ并创建一个channel并且要声明一个exchange:

```javascript
var amqp = require('amqplib');

var rabbit_conn = null;
var channel = null;
var queue = null;

var promise = amqp.connect('amqp://localhost:5672').then(function(conn){
    rabbitConn = conn;
    return rabbitConn.createChannel();
}).then(function(ch){
    channel = ch;
    return channel.assertExchange('rethinkdb', 'topic', {durable: false});
})
```
和把数据推送至RabbitMQ不同, 接受消息我们还需要___queue___. Queues就就和您的邮箱一样暂存您还未处理的消息.
所以我们现在在exchange为不同的topic注册queue.
```javascript
promise = promise.then(function(){
    return channel.assertQueue('', {exclusive: true});
}).then(function(q){
    queue = q.queue;
})
```
如果您愿意的话您还可以给您注册的queue起个名字. 但是我们目前使用了空字符串, 这样的话amqplib内部会随机一个名字分配给queue.

现在我们需要将queue与我们感兴趣的topic绑定. 当然其他的订阅者也可以订阅这个topic, RabbitMQ会将消息发送至每一个queue.
简单起见我们直接订阅有关于`mytable`的全部topic.

```javascript
promise = promise.then(function(){
    return channel.bindQueue(queue, 'rethinkdb', 'mytable.*');
})
```

最后我们需要使用`channel.consume`监听queue并在数据到达的时候将其拿出来并处理, 数据到达时候会触发一个回调:

```javascript
promise = promise.then(function(){
    channel.consume(queue, function(msg){
        var change = JSON.parse(msg.content);
        var tablename = msg.fields.routingKey.split('.')[0];
        var changeType = msg.fields.routingKey.split('.')[1];

        console.log(tablename, 'got a change of type:', changeType);
        console.log(JSON.stringify(change, undefined, 2));
    })
})
```

回调方法内的作用是解析出change消息并打印出来, 并有简略说明是何种change消息.