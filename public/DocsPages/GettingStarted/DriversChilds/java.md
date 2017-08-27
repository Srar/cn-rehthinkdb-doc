# 安装RethinkDB库 #

# 安装 #

## 使用 Maven ##

如果您使用Maven解决依赖, 您需要往`pom.xml`添加以下内容:

```xml
<dependencies>
  <dependency>
    <groupId>com.rethinkdb</groupId>
    <artifactId>rethinkdb-driver</artifactId>
    <version>2.3.3</version>
  </dependency>
</dependencies>
```

## 使用 Gradle ##

如果您使用Gradle解决依赖, 您需要往`build.gradle`的`dependencies`中添加以下内容:

```groovy
dependencies {
    compile group: 'com.rethinkdb', name: 'rethinkdb-driver', version: '2.3.3'
}
```

## 使用 Ant ##

如果您使用Ant解决依赖, 您需要往`build.xml`添加以下内容:

```xml
<artifact:dependencies pathId="dependency.classpath">
  <dependency groupId="com.rethinkdb" artifactId="rethinkdb-driver" version="2.3.3" />
</artifact:dependencies>
```

## 使用 SBT ##

如果您使用SBT解决依赖, 您需要往`build.sbt`添加以下内容:

```scala
libraryDependencies += "com.rethinkdb" % "rethinkdb-driver" % "2.3.3"
```

# 使用 #

```java
import com.rethinkdb.RethinkDB;
import com.rethinkdb.gen.exc.ReqlError;
import com.rethinkdb.gen.exc.ReqlQueryLogicError;
import com.rethinkdb.model.MapObject;
import com.rethinkdb.net.Connection;


public static final RethinkDB r = RethinkDB.r;

Connection conn = r.connection().hostname("localhost").port(28015).connect();

r.db("test").tableCreate("tv_shows").run(conn);
r.table("tv_shows").insert(r.hashMap("name", "Star Trek TNG")).run(conn);
```

# 下一步 #

<div class="infobox ">
    <p>阅读[10分钟快速了解](https://www.rethinkdb.com/docs/guide/java/)来知道如何使用RethinkDB.</p>
</div>