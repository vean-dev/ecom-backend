const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Products");

module.exports.checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { selectedItems } = req.body; // Optional array for selective checkout

    // Retrieve user's cart and populate product details
    const cart = await Cart.findOne({ userId }).populate("cartItems.productId");
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // Determine which items to checkout
    const itemsToCheckout = selectedItems?.length
      ? cart.cartItems.filter((item) =>
          selectedItems.some((sel) => item.productId._id.equals(sel.productId))
        )
      : cart.cartItems;

    if (!itemsToCheckout.length)
      return res
        .status(400)
        .json({ message: "No items selected for checkout" });

    let totalPrice = 0;
    const orderItems = [];

    // Validate stock and prepare order items
    for (const item of itemsToCheckout) {
      const product = item.productId;
      const quantity =
        selectedItems?.find((sel) => sel.productId === product._id.toString())
          ?.quantity || item.quantity;

      if (product.countInStock < quantity) {
        return res
          .status(400)
          .json({ message: `Not enough stock for ${product.name}` });
      }

      // Deduct stock
      product.countInStock -= quantity;
      await product.save();

      const subtotal = product.price * quantity;
      totalPrice += subtotal;

      orderItems.push({ product: product._id, quantity, subtotal });
    }

    // Create the order
    const order = await Order.create({
      userId,
      productsOrdered: orderItems,
      totalPrice,
    });

    // Remove checked-out items from cart
    cart.cartItems = cart.cartItems.filter(
      (item) =>
        !orderItems.some(
          (ordered) =>
            ordered.product.toString() === item.productId._id.toString()
        )
    );
    cart.totalPrice = cart.cartItems.reduce((sum, i) => sum + i.subtotal, 0);
    await cart.save();

    return res
      .status(201)
      .json({ message: "Order created successfully", order });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Controller to retrieve authenticated user's orders
module.exports.getUserOrders = async (req, res) => {
  try {
    const userOrders = await Order.find({ userId: req.user.id })
      .populate("productsOrdered.product", "name price")
      .lean();

    if (!userOrders.length)
      return res.status(404).json({ message: "No orders found" });

    res.status(200).json({
      success: true,
      message: "Orders restrieved succesfuly",
      orders: userOrders,
    });
  } catch (error) {
    // console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// Controller to retrieve all orders (admin only)
module.exports.getAllOrders = async (req, res) => {
  try {
    const allOrders = await Order.find()
      .populate("userId", "firstName lastName email")
      .populate("productsOrdered.product", "name price")
      .lean();

    res.status(200).json({
      success: true,
      message: "Orders restrieved succesfuly",
      orders: allOrders,
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Controller function to update the status of an order
module.exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId; // Get order ID from URL params
    const { status } = req.body; // New status from request body

    console.log(orderId);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.status(200).send({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};
