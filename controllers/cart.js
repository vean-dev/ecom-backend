const Cart = require("../models/Cart");
const Product = require("../models/Products");

// Get User's Cart
module.exports.getUserCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Populate product info
    const cart = await Cart.findOne({ userId }).populate(
      "cartItems.productId",
      "name price"
    );

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    // Recalculate subtotal & total using current product prices
    const cartWithUpdatedPrices = {
      ...cart.toObject(),
      cartItems: cart.cartItems.map((item) => ({
        ...item.toObject(),
        currentPrice: item.productId.price,
        subtotal: item.quantity * item.productId.price,
      })),
    };

    cartWithUpdatedPrices.totalPrice = cartWithUpdatedPrices.cartItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    return res.status(200).json({
      success: true,
      message: "Cart retrieved successfully.",
      cart: cartWithUpdatedPrices,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Add to Cart
module.exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    if (quantity > product.countInStock) {
      return res
        .status(400)
        .json({ success: false, message: "Quantity exceeds stock" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, cartItems: [] });

    const existingItem = cart.cartItems.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.cartItems.push({ productId, quantity });
    }

    // Recalculate subtotals and total
    cart.cartItems.forEach((item) => {
      const productPrice = item.productId.equals(product._id)
        ? product.price
        : item.subtotal / item.quantity;
      item.subtotal = item.quantity * productPrice;
    });

    cart.totalPrice = cart.cartItems.reduce((sum, i) => sum + i.subtotal, 0);
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Item added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Change product quantity in cart
module.exports.changeProductQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || quantity == null || quantity < 1)
      return res
        .status(400)
        .json({ success: false, message: "Invalid quantity or product ID" });

    const [cart, product] = await Promise.all([
      Cart.findOne({ userId }),
      Product.findById(productId),
    ]);
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    if (quantity > product.countInStock)
      return res
        .status(400)
        .json({ success: false, message: "Quantity exceeds stock" });

    const item = cart.cartItems.find(
      (i) => i.productId.toString() === productId
    );
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Product not in cart" });

    item.quantity = quantity;
    item.subtotal = quantity * product.price;
    cart.totalPrice = cart.cartItems.reduce((sum, i) => sum + i.subtotal, 0);

    await cart.save();
    res.status(200).json({ success: true, message: "Quantity updated", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Remove products from Cart
module.exports.removeFromCart = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });

    const item = cart.cartItems.find(
      (i) => i.productId.toString() === productId
    );
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Product not found in cart" });

    cart.cartItems = cart.cartItems.filter(
      (i) => i.productId.toString() !== productId
    );
    cart.totalPrice -= item.subtotal;

    await cart.save();
    res.json({ success: true, message: "Product removed from cart", cart });
  } catch {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Clear Cart Items
module.exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    cart.cartItems = [];
    cart.totalPrice = 0;

    await cart.save();

    res
      .status(200)
      .json({ success: true, message: "Cart cleared successfully", cart });
  } catch (error) {
    //console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
