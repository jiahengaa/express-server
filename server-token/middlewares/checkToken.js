// 监测 token 是否过期
const jwt = require('jsonwebtoken');
module.exports = function(req, res, next) {
  if (req.headers['authorization']) {
    let token = req.headers['authorization'].split(' ')[1];

    // 解构 token，生成一个对象 { name: xx, iat: xx, exp: xx }
    // name为payload里面的内容，可以继续拓展，然后在此处可以做更多判断，比如权限验证等

    let decoded = jwt.decode(token);
    console.log(decoded);
    // 监测 token 是否过期
    if (
      token &&
      decoded.exp !== undefined &&
      decoded.exp <= Date.now() / 1000
    ) {
      return res.json({
        code: 401,
        token: false,
        error: '无效token，请登录'
      });
    } else if (decoded.exp == undefined) {
      res.json({
        code: 402,
        token: false,
        error: '非法token'
      });
    } else {
      next();
    }
  } else {
    return res.json({
      code: 403,
      token: false,
      error: '未提供token'
    });
  }
};
