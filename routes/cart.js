const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart');
const { verify } = require('../auth');

// Get User's Cart
router.get('/', verify, cartController.getUserCart);

// Add to Cart
router.post('/addToCart', verify, cartController.addToCart);

// Change Product Quantity
router.put('/updateQuantity', verify, cartController.changeProductQuantity);

// Remove products from Cart
router.delete('/:productId/removeFromCart', verify, cartController.removeFromCart);

// Clear Cart Items
router.delete('/clearCart', verify, cartController.clearCart);

module.exports = router;