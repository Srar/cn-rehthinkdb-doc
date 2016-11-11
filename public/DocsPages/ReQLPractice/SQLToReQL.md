# SQL转ReQL小抄

<p>
    <img src="/DocsPages/images/SQL-to-ReQL-cheat-sheet.png" class="api_command_illustration">
</p>

## 术语
RethinkDB和SQL中有着绝大多数相似的术语. 下面的表将会把术语一一对比.

| ___SQL___        | ___RethinkDB___                            |
| -----------------|--------------------------------------------|
| database         | database                                   |
| table            | table                                      | 
| row              | document(为了方便起见我把`文档`汉化成了`记录`)   | 
| column           | field                                      | 
| table joins      | table joins                                | 
| primary key      | primary key (默认为`id`字段)                 | 
| index            | index                                      | 

## 插入
<table class="table-top-aligned">
    <thead><tr><th>SQL</th><th>ReQL</th></tr></thead>
    <tbody>
        <tr>
            <td>
                <pre><code>          
INSERT users(user_id,
             age,
             name)
VALUES ("f62255a8259f",
        30,
        Peter)      
                </code></pre>
            </td>
            <td>
<pre><code>
r.table("users").insert({
   userId: "f62255a8259f",
   age: 30,
   name: "Peter"
})
</code></pre>
            </td>
        </tr>
    </tbody>
</table>

## 查询
<table class="table-top-aligned">
    <thead><tr><th>SQL</th><th>ReQL</th></tr></thead>
    <tbody>
        <tr>
            <td>
                <pre><code>SELECT \* FROM users</code></pre>
            </td>
            <td>
                <pre><code>r.table("users")</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT user_id, name FROM users</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").pluck("userId", "name")</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT \* FROM users WHERE name = "Peter"</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").filter({ name: "Peter" })</code></pre>
                 <p>如果您建了索引还能那么干</p>
                 <pre><code>r.table("users")
 .getAll("Peter", {index: "name"})</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT \* FROM users
WHERE name = "Peter"
AND age = 30</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").filter({
    name: "Peter",
    age: 30
})</code></pre>
            </td>
        </tr>



        <tr>
            <td>
                <pre><code>SELECT \* FROM users
WHERE name LIKE "P%"</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").filter(
    r.row("name").match("^P")
)</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT \* FROM users
ORDER BY name ASC</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").orderBy("name")</code></pre>
            </td>
        </tr>


        <tr>
            <td>
                <pre><code>SELECT \* FROM users
ORDER BY name DESC</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").orderBy(r.desc("name"))</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT user_id FROM users
WHERE name = "Peter"
ORDER BY name DESC</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").filter({
    name: "Peter"
}).orderBy(
    r.desc("name")
).pluck("userId")</code></pre>
            </td>
        </tr>


        <tr>
            <td>
                <pre><code>SELECT \* FROM users LIMIT 5 SKIP 10</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").skip(10).limit(5)</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT \* FROM users
WHERE name IN ('Peter', 'John')</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").filter(
  function (doc) {
    return r.expr(["Peter","John"])
            .contains(doc("name"));
  }
)</code></pre>
            <p>如果您对`name`字段建立了索引可以这样查询:</p>
            <pre><code>r.table("users")
 .getAll("Peter", "John", {index: "name"})</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT \* FROM users
WHERE name NOT IN ('Peter', 'John')</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").filter(
  function (doc) {
    return r.expr(["Peter","John"])
            .contains(doc("name"))
            .not();
  }
)</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT COUNT(\*) FROM users</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").count()</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT COUNT(name) FROM users WHERE age > 18</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").filter(
    r.row.hasFields("name")
    .and(r.row("age").gt(18))
).count()</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT AVG("age") FROM users</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").avg("age")</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT MAX("age") FROM users</code></pre>
            </td>
            <td>
                <pre><code>r.table("users")("age").max()</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT DISTINCT(name) FROM users</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").pluck("name").distinct()</code></pre>
            </td>
        </tr>


        <tr>
            <td>
                <pre><code>SELECT *
    FROM users
    WHERE age BETWEEN 18 AND 65;</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").filter(
    r.row("age").ge(18)
     .and(r.row("age").le(65))
)</code></pre>
            <p>如果您对`age`字段建立了索引可以这样查询:</p>
            <pre><code>r.table("users")
 .between(18, 65, {index: "age"})</code></pre>
            </td>
        </tr>


        <tr>
            <td>
                <pre><code>SELECT name, 'is_adult' = CASE
    WHEN age>18 THEN 'yes'
    ELSE 'no'
    END
FROM users</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").map({
    name: r.row("name"),
    is_adult: r.branch(
        r.row("age").gt(18),
        "yes",
        "no"
    )
})</code></pre>
            </td>
        </tr>


        <tr>
            <td>
                <pre><code>SELECT *
  FROM posts
  WHERE EXISTS
    (SELECT * FROM users
     WHERE posts.author_id
         = users.id)</code></pre>
            </td>
            <td>
                <pre><code>r.table("posts")
  .filter(function (post) {
    return r.table("users")
      .filter(function (user) {
        return user("id").eq(post("authorId"))
      }).count().gt(0)
    })</code></pre>
            </td>
        </tr>

    </tbody>
</table>

## 更新

<table class="table-top-aligned">
    <thead><tr><th>SQL</th><th>ReQL</th></tr></thead>
    <tbody>
        <tr>
            <td>
                <pre><code>UPDATE users
    SET age = 18
    WHERE age < 18</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").filter(
    r.row("age").lt(18)
).update({age: 18})</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>UPDATE users
    SET age = age + 1</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").update(
    { age: r.row("age").add(1) }
)</code></pre>
            </td>
        </tr>
    </tbody>
</table>

## 删除

<table class="table-top-aligned">
    <thead><tr><th>SQL</th><th>ReQL</th></tr></thead>
    <tbody>
        <tr>
            <td>
                <pre><code>DELETE FROM users</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").delete()</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>DELETE FROM users
WHERE age < 18</code></pre>
            </td>
            <td>
                <pre><code>r.table("users")
 .filter(r.row("age").lt(18))
 .delete()</code></pre>
            </td>
        </tr>
    </tbody>
</table>

## 表连接

<table class="table-top-aligned">
    <thead><tr><th>SQL</th><th>ReQL</th></tr></thead>
    <tbody>
        <tr>
            <td>
                <pre><code>SELECT *
FROM posts
JOIN users
ON posts.user_id = users.id</code></pre>
            </td>
            <td>
                <pre><code>r.table("posts").innerJoin(
  r.table("users"),
  function (post, user) {
    return post("userId").eq(user("id"));
}).zip()</code></pre>
                <p>提示: 使用<code>zip()</code>命令会合并左右表查询记录，会覆盖字段名相同的字段.</p>
                <p>如果您在右表有主键或已建立索引可以使用<a href="https://www.rethinkdb.com/api/javascript/eq_join/">eqJoin</a>来进行表连接查询</p>
                <pre><code>r.table("posts").eqJoin(
    "id",
    r.table("users"),
    {index: "id"}
).zip()</code></pre>
            </td>
        </tr>

        <tr>
            <td> <pre><code>SELECT posts.id AS post_id,
       user.name,
       users.id AS user_id
    FROM posts
    JOIN users
        ON posts.user_id = users.id

SELECT posts.id AS post_id,
       user.name,
       users.id AS user_id
    FROM posts
    INNER JOIN users
        ON posts.user_id = users.id</code></pre>
            </td>
            <td> 
               <pre><code>r.table("posts").innerJoin(
  r.table("users"),
  function (post, user) {
    return post("userId").eq(user("id"));
}).map({
  postId: r.row("left")("id"),
  userId: r.row("right")("id"),
  name: r.row("right")("name")
})</code></pre>
            </td>
        </tr>


        <tr>
            <td> <pre><code>SELECT *
    FROM posts
    RIGHT JOIN users
        ON posts.user_id = users.id

SELECT *
    FROM posts
    RIGHT OUTER JOIN users
        ON posts.user_id = users.id</code></pre>
            </td>
            <td> 
               <pre><code>r.table("posts").outerJoin(
  r.table("users"),
  function (post, user) {
    return post("userId").eq(user("id"));
}).zip()</code></pre>
                <p>您可以使用<a href="https://www.rethinkdb.com/api/javascript/concat_map/">concatMap</a>来获得更好的外连接性能</p>
                <pre><code>r.table("posts").concatMap(
  function (post) {
    return r.table("users")
    .getAll(post("id"), {index: id})
    .do(
      function (result) {
        return r.branch(
          result.count().eq(0),
          [{left: post}],
          result.map(function (user) {
            return {
              left: post, right: user
            };
          })
        );
      }
    );
  }
).zip();</code></pre>
            </td>
        </tr>


        <tr>
            <td>
                <pre><code>DELETE FROM users</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").delete()</code></pre>
            </td>
        </tr>
    
    </tbody>
</table>

## 聚合操作

<table class="table-top-aligned">
    <thead><tr><th>SQL</th><th>ReQL</th></tr></thead>
    <tbody>
        <tr>
            <td>
                <pre><code>SELECT category
    FROM posts
    GROUP BY category</code></pre>
            </td>
            <td>
                <pre><code>r.table("posts").map(
    r.row("category")
).distinct()</code></pre>
            </td>
        </tr>

         <tr>
            <td>
                <pre><code>SELECT category,
       SUM('num_comments')
    FROM posts
    GROUP BY category</pre>
            </td>
            <td>
                <pre><code>r.table('posts')
 .group('category')
 .sum('num_comments')</code></pre>
            </td>
        </tr>

         <tr>
            <td>
                <pre><code>SELECT category
    FROM posts
    GROUP BY category</code></pre>
            </td>
            <td>
                <pre><code>r.table("posts").map(
    r.row("category")
).distinct()</code></pre>
            </td>
        </tr>

         <tr>
            <td>
                <pre><code>SELECT category,
       status,
       SUM('num_comments')
    FROM posts
    GROUP BY category, status</code></pre>
            </td>
            <td>
                <pre><code>r.table("posts")
 .group('category', 'status')
 .sum('num_comments')</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT category,
       SUM(num_comments)
    FROM posts
    WHERE num_comments > 7
    GROUP BY category</code></pre>
            </td>
            <td>
                <pre><code>r.table("posts")
 .filter(r.row('num_comments').gt(7))
 .group('category')
 .sum('num_comments')</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT category,
       SUM(num_comments)
    FROM posts
    GROUP BY category
    HAVING num_comments > 7</code></pre>
            </td>
            <td>
                <pre><code>r.table("posts")
 .group('category')
 .sum('num_comments')
 .ungroup()
 .filter(r.row("reduction").gt(7))</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>SELECT title,
        COUNT(title)
    FROM movies
    GROUP BY title
    HAVING COUNT(title) > 1</code></pre>
            </td>
            <td>
                <pre><code>r.table("movies")
 .group("title")
 .count()
 .ungroup()
 .filter(r.row("reduction").gt(1))</code></pre>
            </td>
        </tr>
    </tbody>
</table>

## 表与数据库操作

<table class="table-top-aligned">
    <thead><tr><th>SQL</th><th>ReQL</th></tr></thead>
    <tbody>
        <tr>
            <td>
                <pre><code>CREATE DATABASE my_database;</code></pre>
            </td>
            <td>
                <pre><code>r.dbCreate('my_database')</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>DROP DATABASE my_database;</code></pre>
            </td>
            <td>
                <pre><code>r.dbDrop('my_database')</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>CREATE TABLE users
    (id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(50),
    age INT);</code></pre>
            </td>
            <td>
                <pre><code>r.tableCreate('users', {primaryKey: "id"})</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>TRUNCATE TABLE users;</code></pre>
            </td>
            <td>
                <pre><code>r.table("users").delete()</code></pre>
            </td>
        </tr>

        <tr>
            <td>
                <pre><code>DROP TABLE users;</code></pre>
            </td>
            <td>
                <pre><code>r.tableDrop("users")</code></pre>
            </td>
        </tr>



    </tbody>
</table>

## 了解更多
点击以下链接了解ReQL更多信息
* [Lambda functions in RethinkDB](https://www.rethinkdb.com/blog/lambda-functions/)
* [Introduction to map-reduce](/docs/2-5)
* [Introduction to Joins](/docs/2-4)
* [API Reference](https://www.rethinkdb.com/api/javascript/)