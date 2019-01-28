const express = require('express');
const ProductController = require('../controllers/productController.js');
const router = express.Router();

ProductController(router);

module.exports = router;
