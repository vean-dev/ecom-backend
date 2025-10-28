const express = require("express");
const router = express.Router();
const auth = require("../auth");
const orderController = require("../controllers/order");
const { verify, verifyAdmin } = auth;

// Route to create order (checkout) for non-admin users
router.post("/checkout", verify, orderController.checkout);

// Route to retrieve authenticated user's orders
router.get("/my-order", verify, orderController.getUserOrders);

// Route to retrieve all orders (admin only)
router.get("/", verify, verifyAdmin, orderController.getAllOrders);

// Route to update the status of an order (admin only)
router.put("/:orderId", verify, verifyAdmin, orderController.updateOrderStatus);

module.exports = router;
