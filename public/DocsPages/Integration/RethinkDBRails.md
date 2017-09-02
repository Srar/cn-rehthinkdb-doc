# Ruby on Rails中使用RethinkDB

Ruby on Rails中使用RethinkDB非常容易.
本文假设您已经略熟悉Rails与ActiveRecord.
我们将使用一个类似于ActiveRecord的RethinkDB ORM: [NoBrainer](http://nobrainer.io/).

## 开始
使用NoBrainer生成一个新的Rails项目:

```shell
$ rails new nb_app
$ cd nb_app
$ echo "gem 'nobrainer'" >> Gemfile
$ bundle install
$ rails g nobrainer:install
```

您现在可以开始创建modules了. 假设这里有一个Article表:

```shell
$ rails g scaffold Article title:string text:string tags:array
```

随后生成的module文件会在`app/models/article.rb`:

```ruby
class Article
  include NoBrainer::Document
  include NoBrainer::Document::Timestamps

  field :title, :type => String
  field :text, :type => String
  field :tags, :type => Array
end
```

现在您可以开始使用RethinkDB与Rails了!

## 深入使用Models

RethinkDB不像传统数据库一样会限定您输入数据库的数据类型, 
所以NoBrainer是在将数据在查询运行之前就开始验证您的数据类型是否合规.
如果您不想指定类型可以使用`dummy type object`.

`User`表中我们希望有个`name`字段, 并且这个字段值必须是字符串. 还有个`user_data`字段, 该字段值只要是有效JSON就行.

```ruby
class User
  include NoBrainer::Document
  include NoBrainer::Document::Timestamps

  field :name, :type => String, :index => true
  field :custom_data
end
```

同时`NoBrainer`会自动为这个表生成`created_on`与`updated_on`来存储时间戳.
也许您也注意到了在`name`字段上我们添加了一个索引, 现在我们把索引实际的添加进数据库中吧.

```
$ rake nobrainer:sync_schema
```

## 关系模型

您也可以在命令行中创建module并指定表和表之间的关系:

```
$ rails g model Comment body:string liked:boolean \
    user:belongs_to article:belongs_to
```

生成的module内容如下:

```ruby
class Comment
  include NoBrainer::Document
  include NoBrainer::Document::Timestamps

  field :body, :type => String
  field :liked, :type => Boolean
  belongs_to :user
  belongs_to :article
end
```

如果我们现在再编辑`Article`模型直接添加`has_many`变量来与`Comment`模型建立关系, 此时`has_many`就会变为只读状态.
同时由于RethinkDB不支持表外键, 所以需要开发人员自行维护不同表之间的记录关系.

## 验证器

我们同样也可以在字段上指定说改字段需要验证. 现在我们对`Article`model内的一些字段添加一些验证规则:

```ruby
class Article
  include NoBrainer::Document
  include NoBrainer::Document::Timestamps

  has_many :comments # read only!

  field :title, :type => String
  field :text,  :type => String, :required => true
  field :tags,  :type => Array, :default => []

  validates :title, :length => { minimum: 5 }
end
```

当设置验证器之后NoBrainer只有在写操作情况下会对数据进行验证, 读操作情况下不会对数据进行验证.

有关于NoBrainery验证器的更多内容请查阅[NoBrainer validation文档](http://nobrainer.io/docs/validations/).

## Views中输出嵌套记录

由于`has_many`是在`Article`module中是只读的, 所以此时处理`has_many`嵌套记录有点小区别.

```ruby
<%= form_for([@article, Comment.new(:article => @article)]) do |f| %>
  <b>Make a comment:</b><br>
  <%= f.label "I liked this article" %> <%= f.check_box :liked %><br>
  <%= f.text_area :body %>
  <%= f.submit %>
<% end %>
```

## 查询

NoBrainer对ReQL做了一层轻量级封装, 我们来看些示例:

```ruby
# 通过主键来查询一条记录
Article.find "2FrYybOfzezVpT"

# 查询name字段内的值包含'bob'的记录, 并且对查询到的记录来排序.
# Note: NoBrainer默认情况下会对name字段使用索引进行查询.
User.where(:name => /bob/).order_by(:name => :desc).to_a

# 随机获取两条不喜欢该评论的记录.
Comment.where(:liked => false).sample(2)
```

这里有一篇非常全面的[NoBrainer查询使用文档](http://nobrainer.io/docs/querying/).
由于NoBrainer是对ReQL做了封装, 所以您在了解ReQL之后只需要变换下格式就能使用NoBrainer来做查询.