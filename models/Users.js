const mongoose = require("mongoose");
const Cart = require("./Cart");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    // select: false,
  },
  mobileNo: {
    type: String,
    required: true,
  },
  address: {
    street: String,
    barangay: String,
    city_municipality: String,
    province: String,
    region: String,
    country: String,
    postal_code: String,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
  },
});

module.exports = mongoose.model("Users", userSchema);
