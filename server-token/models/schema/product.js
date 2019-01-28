const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  name: {
    type: String,
    index: true,
    unique: true
  },
  productType: String,
  price: String,
  initDate: Date
});

const Product = (module.exports = mongoose.model('Product', productSchema));
