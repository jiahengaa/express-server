> 项目介绍

- 采用`vue-cli` 构建初始项目目录
- 使用`vue2`、`vue-router2`、`Element-ui`、`express`、`webpack2`、`gulp`构建项目开发环境
- 前端采用 Vue、Element-ui 搭建页面以及 Vuex 进行数据处理，后端采用 express 完成注册、登录、登出、登录状态查询的 restful API
- 目前分为 session 登录和 token 登录
- 页面为注册页，登录页，主页

> 目录及文件的改动，均含详细备注

1. package.json 中的'dependencies'包含的是增加的 npm 包
2. config/index.js 中设置了请求端口代理，能够跨域访问服务器端口（8080 => 3000）
3. server 主要是服务端的路由以，api 接口，mongodb 的配置操作
4. src 为 vue 应用的主要文件，包含路由，component...
5. gulpfile.js 增加服务器重启和浏览器刷新任务
6. server.js 服务端启动文件

> 项目区分

1. session 登录的前后端对应 src 和 server
2. token 登录的前后端对应 src-token 和 server-token
3. 主要是通过 express 设置当前目录为静态资源位置，通过根目录下的 index.html 进入不同的 src 下的 index.html，从而实现项目区分

服务端通过 cors 设置同源访问

> 操作指令

```shell
npm install 安装依赖

npm run dev 使用webpack开启前端资源的打包编译

npm run server  启动服务端并开启浏览器
```

这里需要双开两个命令行窗口，一个负责前端的编译，一个负责服务端的任务流

> 环境搭建的详细解决思路

- [x] 实现了基本登录 cookie && session
- [x] 独立系统登录 token
- [ ] 第三方登录 access_token

---

> 详谈注册/登录/登出

一. [登录功能实现的原理](#1)
二. [登录功能实现的几种方式](#2)
三. [基本登录 cookie && session 详解](#3)
四. [token 登录 详解](#4)

<h3 id="1">一. 登录功能实现的原理</h3>

浏览器用户提交表单后与服务器产生会话，传递给服务器一个识别信息，同时服务器这边有相应的数据，因此能够对其进行比较，然后识别是否为正确的用户，而且一般需要设定此数据的存储时长，也就是用户认证的时长，过了这个时间段，则会失效，需要重新登录，因此这里需要有四个关键点，**浏览器的信息**，**服务器的信息**，**两个信息的对比**，**时效设定**。

<h3 id="1">二. 登录功能实现的几种方式</h3>

1. 基本登录 cookie && session
   浏览器提交用户表单后，服务器接受表单中的用户信息，将其存在 session 表中（session 表存在内存，数据库，缓存等），然后以 cookie 的方式（cookie 中存有 sessionId 及对应值）传回给浏览器，这样只要服务端设置的 cookie 没有失效，则在这段时间内，服务端便能正确识别用户信息，不用重复登录（sessionID 是在服务端销毁的）

   - 服务器端的产生 Session ID
   - 服务器端和客户端存储 Session ID
   - 从 HTTP Header 中提取 Session ID
   - 根据 Session ID 从服务器端的 Hash 中获取请求者身份信息

2. `token`（JSON Web Token）

   参考资料：

   [JSON Web Token 详情](http://blog.leapoahead.com/2015/09/06/understanding-jwt/)

   [八幅漫画理解使用 JSON Web Token 设计单点登录系统](http://blog.leapoahead.com/2015/09/07/user-authentication-with-jwt/)

   用户提交其信息表单（比如包含 username,password），服务端收到后，将 username 转为 userId 存储在 JWT 的 payload（负荷）中，与头部进行 Base64 编码拼接后进行签名，于是形成了 JWT，在 cookie 中保存返回给浏览器并设置时效，在失效之前浏览器每次请求时都会携带有 JWT 的 cookie，因此服务端可以对 JWT 进行解密，与数据库中的 user 进行比较，确认无误后，便返回请求。

   - cookie&&session 需要服务端提供独立机制来存储 sessionId(内存，数据库等)
   - cookie&&token 不需要服务端进行额外存储，但增加了加密，解密，编码等操作

   > 单点登录（一个站点登录，其余站点皆可登录）

   - cookie&&session sessionId 是需要存储在服务器上的，因此多个域名下的服务器都需要同步 sessionId
   - JWT 是通过 cookie 传递的，并且不需要额外存储，只需要将含有 JWT 的 cookie 的域名设置为顶级域名，则旗下的域名皆可访问到此 cookie 以及其中包含的 JWT

3) 第三方：`access_token`

<h3 id="3">三. 基本登录 cookie && session 详解 </h3>

1. 通过 mongoose 建立数据模型，以 name 为主索引并设置其唯一属性，此例中，我们服务端采用内存储存 sessionId，也可尝试 mongoDB 或 redis 等，均有相应的中间件可以使用。

2. 登录 POST： `/api/login`
   在前端 vue 中怎样识别登录状态，当输入用户表单后点击登录，我们向`/api/login`发起了`pos`t 请求，`/api/login`对应的控制器中进行了这样几步流程

- request 中包含的用户信息（用户名，密码），生成 mogoose 实例

- 进入 mongoDB 中查找此用户名的信息（User 的 Skema 模型中已经设定 name 为唯一的索引，不能重复的）

- 没有找到，返回无此用户名，找到则与数据库中的密码与此密码进行比较（在生成 mongoose 实例时，都将密码进行了 sha1 加密）

- 密码匹配正确，返回正确信息，并写入 session

      // 用户信息写入 session
      delete user.password;
      req.session.user = user;

- 密码匹配失败，否则返回密码错误的信息

  在其它如/api/register、/api/user 中通过判断 req.session.user 的存在与否，来实现登录登出状态的改变

  ```javascript
  checkLogin(req, res, next) {
      if (!req.session.user) {
        return res.json({
           error: '未登录'
        });
      }
      next();
    },

    checkNotLogin(req, res, next) {
      if (req.session.user) {
        return res.json({
          error: '已登录'
        });
      }
      next();
    }
  ```

  至此，当流程跑通之后，我们能够得到返回登录成功的信息，接下来就可以在前端通过`vue-router`实现跳转，以及将获取的 user 信息填入`localstorage`，供其它页面使用其数据。

3. 注册 POST： `/api/register`

   注册功能的实现，同样当我们填写完注册表单后， `/api/register`对应的控制器中将接受我们提交之后的数据。

   - 通过 request 获取用户名和密码，并将密码加密（此处采用 sha1），生成 mongoose 实例，同时通过`objectid-to-timestamp`将实例中的 objectId 转化为时间格式，即为此实例的创建时间，具体可看**疑问详解**。
   - 通过唯一的 name 属性，进入数据库查询，看该用户名是否已经被注册，返回相应的数据。

4. 登出 GET：`/api/user`

此 api 的作用是实现登出功能的，当点击登出后，vue 通过 axios 访问此 api，api 对应的控制器中将执行以下代码

```javascript
// delete user session
req.session.user = null;
res.json({
  message: '登出成功'
});
```

5. 登录状态判断

   使用 axios 的拦截器，后端通过 checkLogin 函数判断 session 是否存在，返回 sesssion 的状态，在 axios 的响应拦截器中进行跳转设置，具体代码参见`./src/util/interceptor.js`

<h3 id="4">四. token登录 详解 </h3>

- 注册登录的实现基本和 session 相同，除了数据库模型中添加了 token 属性，然后主要是登录状态的不同

- 使用 token 判断登录状态，主要是后端的 checkToken，将前端请求中携带的 token 进行解码，获取其设置的有效时长，从而返回 token 状态，同样使用 axios 的拦截器，在请求拦截器中添加头部 Authorization 的 token，在响应拦截器中设置判断

---

> 疑问详解

1. objectid-to-timestamp 包的作用

   首先了解 MongoDB 中的`ObjectId`，每一个 document（即 MySQL 中的 row 每一行数据），均含有一个`_id`的属性，而其属性值即为`ObjectId`

   `ObjectId` 是一个 12 字节 BSON 类型数据，有以下格式：

   - 前 4 个字节表示时间戳（**数据创建的时间**）
   - 接下来的 3 个字节是机器标识码
   - 紧接的两个字节由进程 id 组成（PID）
   - 最后三个字节是随机数。

   因此它的作用即是将前四个字节转化为时间格式。

2. 浏览器刷新之后，vuex 维护的全局状态全部消失 ​

- 理解 vuex 的作用，以及使用本地存储一些状态数据的意义
- vuex 状态管理是为了可维护性和可扩展性，和本地缓存没有任何关系。
- [详情可看 github issue](https://github.com/vuejs/vuex/issues/47)

3. vue-router 中的路由拦截详细介绍

```javascript
  router.beforeEach((to, from, next) => {
    next({
        path: '/login',
        query: {
            redirect: to.fullPath
        }
    })
  })
  // vue-router 的导航钩子函数beforeEach
  to : 将要进入的 路由对象
  from : 当前导航正要离开的路由
  next : 调用next()， resolve beforeEach这个钩子，即调用后，表示这个钩子函数结束了，同时里面可以设置一些跳转等

  path: 表示将要跳转的路由
  query: 配置路由url的参数
  fullPath: 完成解析后的 URL，包含查询参数和 hash 的完整路径。

  query: {
      redirect: to.fullPath
  }

  这个表示，在当前路由中添加查询参数redirect，以及redirect的值to.fullPath，
  to.fullPath表示跳转之前的路由url

```
