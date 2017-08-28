# ReQL 错误类型
RethinkDB有三种错误: RethinkDB库错误(ReqlDriverError), 查询错误(ReqlCompileError), 运行时错误(ReqlRuntimeError).

## 错误类型
`ReqlCompileError`: 查询无法被服务器解析，这可能是语法错误，也有可能是指定了错误的参数.
___注意___: 有些语言的RethinkDB库会在查询发送给RethinkDB实例前就会返回`ReqlDriverError`错误.

`ReqlRuntimeError`: 父类中全部运行错误. 应用程序可能会使用它来代表全部错误，但是RethinkDB会返回一个更具体的错误. 

`ReqlQueryLogicError`: ReQL表达式中逻辑错误，列如往整数里加字符串.

`ReqlNonExistenceError`: 访问一个不存在的字段或者访问一个不存在的其他东西.

`ReqlResourceLimitError`: 查询上限限制(比如数组长度过大).

`ReqlTimeoutError`: 查询超时(这个错误只会发生在客户端).

`ReqlAvailabilityError`: `ReqlOpFailedError`与`ReqlOpIndeterminateError`的父类. 代表集群不可用. 程序可能会用它抛出异常来说明集群错误，但是RethinkDB实例只会返回它的子类. 

`ReqlOpFailedError`: 由于表状态不可用，配置错误，集群不可用导致操作失败.

`ReqlOpIndeterminateError`: 无法验证集群状态，配置或表是否可用.

`ReqlUserError`: 用户自定义[异常](https://www.rethinkdb.com/api/javascript/error/).

`ReqlInternalError`: RethinkDB内部错误.

`ReqlDriverError`: RethinkDB库错误，可能是库有BUG，或者调用了未实现的命令，或者无法序列化查询.

`ReqlPermissionsError`: 用户没有选择执行查询. 了解更多[RethinkDB帐号权限](https://www.rethinkdb.com/docs/permissions-and-accounts/).

`ReqlAuthError`: RethinkDB无法对客户端验证失败，继承自`ReqlDriverError`.

## 继承关系

全部错误的基类为`ReqlError`

* `ReqlError`
    * `ReqlCompileError`
    * `ReqlRuntimeError`
    * `ReqlQueryLogicError`
        * `ReqlNonExistenceError`
    * `ReqlResourceLimitError`
    * `ReqlUserError`
    * `ReqlInternalError`
    * `ReqlTimeoutError`
    * `ReqlAvailabilityError`
        * `ReqlOpFailedError`
        * `ReqlOpIndeterminateError`
    * `ReqlPermissionsError`
    * `ReqlDriverError`
        * `ReqlAuthError`
