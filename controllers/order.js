const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Products");

module.exports.checkout = async function(req, res) {
    try {
        // Get user ID from request
        const userId = req.user.id;

        // Retrieve user's cart and populate the productId field
        const userCart = await Cart.findOne({ userId }).populate('cartItems.productId');

        if (!userCart) {
            return res.status(404).send({ message: "Cart not found" });
        }

        // Check if countInStock is enough for each product in the cart
        for (const item of userCart.cartItems) {
            const product = item.productId;
            if (product.countInStock < item.quantity) {
                return res.status(400).send({ message: `Not enough stock for ${product.name}` });
            }
        }

        // Retrieve product ID and quantity from request body
        const { productId, quantity } = req.body;

        // Find the product by ID
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send({ message: `Product not found for ID: ${productId}` });
        }

        // Check if countInStock is enough for the requested quantity
        if (product.countInStock < quantity) {
            return res.status(400).send({ message: `Not enough stock for ${product.name}` });
        }

        // Create order item
        const orderItem = {
            product: productId,
            quantity: quantity,
            subtotal: quantity * product.price
        };

        // Create order based on order item
        const order = new Order({
            userId: userId,
            productsOrdered: [orderItem],
            totalPrice: orderItem.subtotal
        });

        // Deduct countInStock for the product
        product.countInStock -= quantity;
        await product.save();

        // Save order to database
        await order.save();

        res.status(201).send({ message: "Order created successfully", order: order });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};




module.exports.checkoutSelected = async function(req, res) {
    try {
        // Get user ID from request
        const userId = req.user.id;

        // Retrieve user's cart and populate the productId field
        const userCart = await Cart.findOne({ userId }).populate('cartItems.productId');

        if (!userCart) {
            return res.status(404).send({ message: "Cart not found" });
        }

        const { selectedItems } = req.body;

        // Validate selectedItems array
        if (!Array.isArray(selectedItems)) {
            return res.status(400).send({ message: "Invalid selected items" });
        }

        // Initialize variables to track total price and selected products
        let totalPrice = 0;
        let selectedProducts = [];

        // Iterate through selectedItems array and validate each item
        for (const selectedItem of selectedItems) {
            const { productId, quantity } = selectedItem;
            const cartItem = userCart.cartItems.find(item => item.productId.equals(productId));

            // Check if the item is in the cart and the requested quantity is available
            if (!cartItem || cartItem.quantity < quantity) {
                return res.status(400).send({ message: `Invalid quantity for product with ID ${productId}` });
            }

            const product = cartItem.productId;

            // Add selected product to selectedProducts array
            selectedProducts.push({
                product: productId,
                quantity: quantity,
                subtotal: quantity * product.price
            });

            // Update total price
            totalPrice += quantity * product.price;
        }

        // Create order based on selected products
        const order = new Order({
            userId: userId,
            productsOrdered: selectedProducts,
            totalPrice: totalPrice
        });

        // Deduct countInStock for selected products
        for (const selectedItem of selectedProducts) {
            const { product: productId, quantity } = selectedItem;
            const product = await Product.findById(productId);

            if (!product || product.countInStock < quantity) {
                return res.status(400).send({ message: `Not enough stock for product with ID ${productId}` });
            }

            product.countInStock -= quantity;
            await product.save();
        }

        // Remove selected items from the user's cart
        for (const selectedItem of selectedItems) {
            const { productId, quantity } = selectedItem;
            const cartItemIndex = userCart.cartItems.findIndex(item => item.productId.equals(productId));

            if (cartItemIndex !== -1) {
                userCart.cartItems[cartItemIndex].quantity -= quantity;
                userCart.totalPrice -= quantity * userCart.cartItems[cartItemIndex].productId.price;

                if (userCart.cartItems[cartItemIndex].quantity <= 0) {
                    userCart.cartItems.splice(cartItemIndex, 1);
                }
            }
        }

        await userCart.save(); // Update user's cart

        // Save order to database
        await order.save();

        res.status(201).send({ message: "Order created successfully", order: order });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};





// Controller to retrieve authenticated user's orders
module.exports.getUserOrders = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).send({ error: 'Unauthorized' });
        }

        const userId = req.user.id;

        const userOrders = await Order.find({ userId }).populate('productsOrdered.product');

        res.status(200).send({ orders: userOrders });
    } catch (error) {
        console.error("Error in retrieving user's orders:", error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};

// Controller to retrieve all orders (admin only)
module.exports.getAllOrders = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).send({ message: "Access denied. Only admin users can perform this action." });
        }

        const allOrders = await Order.find().populate('productsOrdered.product');

        res.status(200).send({ orders: allOrders });
    } catch (error) {
        console.error("Error in retrieving all orders:", error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};

// Controller function to update the status of an order
module.exports.updateOrderStatus = async (req, res) => {
    try {
        // Get the order ID from request body
        const orderId = req.body.id;

        // Find the order by ID
        const order = await Order.findById(orderId);

        // Check if the order exists
        if (!order) {
            return res.status(404).send({ message: 'Order not found' });
        }

        // Update the order status
        order.status = req.body.status;

        // Save the updated order
        await order.save();

        // Send response
        res.status(200).send({ message: 'Order status updated successfully', order });
    } catch (error) {
        //console.error('Error in updating order status:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};