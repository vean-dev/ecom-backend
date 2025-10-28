const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart");
const { verify } = require("../auth");

// Get User's Cart
router.get("/", verify, cartController.getUserCart);

// Add to Cart
router.post("/add-to-cart", verify, cartController.addToCart);

// Change Product Quantity
router.put("/update-quantity", verify, cartController.changeProductQuantity);

// Remove products from Cart
router.delete("/:productId", verify, cartController.removeFromCart);

// Clear Cart Items
router.delete("/", verify, cartController.clearCart);

module.exports = router;
