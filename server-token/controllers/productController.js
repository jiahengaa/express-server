const express = require('express');
const Product = require('../models/schema/product');
const router = express.Router();
const moment = require('moment');
const objectIdToTimestamp = require('objectid-to-timestamp');
const checkToken = require('../middlewares/checkToken');

// 注册
const AddProduct = (req, res) => {
  // 这里的userRegister为mongoose中的
  // Entity —— 由Model创建的实体，使用save方法保存数据
  let productRegister = new Product({
    name: req.body.name,
    productType: req.body.productType,
    price: req.body.price
  });

  // 将 objectId 转换为 用户创建时间
  // objectId即为每一行数据中的_id
  // ObjectId 是一个12字节 BSON 类型数据，有以下格式：
  // 前4个字节表示时间戳
  // 接下来的3个字节是机器标识码
  // 紧接的两个字节由进程id组成（PID）
  // 最后三个字节是随机数。
  // 因此objectIdToTimestamp的作用即是将前4个字节的时间戳转化
  productRegister.initDate = moment(
    objectIdToTimestamp(productRegister._id)
  ).format('YYYY-MM-DD HH:mm:ss');

  Product.findOne({
    name: productRegister.name.toLowerCase()
  })
    .then(product => {
      if (product) {
        product.json({
          success: false,
          message: '该产品已注册'
        });
      } else {
        productRegister.save((err, product) => {
          if (err) {
            res.json(err);
          } else {
            res.json(product);
          }
        });
      }
    })
    .catch(err => res.json(err));
};

// 登录
const GetList = (req, res) => {
  Product.find()
    .then(list => {
      res.json(list);
    })
    .catch(err => res.json(err));
};

// 所有用户打印
const GetToken = (req, res) => {};

module.exports = router => {
  router.post('/addProduct', AddProduct),
    router.get('/getList', checkToken, GetList);
};
