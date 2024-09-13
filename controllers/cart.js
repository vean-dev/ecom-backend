const Cart = require('../models/Cart');
const Product = require('../models/Products');



// Get User's Cart
module.exports.getUserCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId }).populate('cartItems.productId', 'name price');
        
        if (!cart) {
            return res.status(404).send({ message: 'Cart not found' });
        }
        
        res.status(200).send({ cart });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};


// Add to Cart
module.exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ message: 'Product not found' });
        }

        if (quantity > product.countInStock) {
            return res.status(400).send({ message: 'Requested quantity exceeds available stock' });
        }
        
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({
                userId,
                cartItems: [],
                totalPrice: 0 // Initialize totalPrice if cart is newly created
            });
        }
        
        const existingCartItem = cart.cartItems.find(item => item.productId.toString() === productId);
        if (existingCartItem) {
            existingCartItem.quantity += quantity;
            existingCartItem.subtotal += quantity * product.price;
        } else {
            cart.cartItems.push({
                productId,
                quantity,
                subtotal: quantity * product.price
            });
        }
        
        cart.totalPrice += quantity * product.price; // Update totalPrice
        await cart.save();
        
        res.status(201).send({ message: 'Item added to cart successfully', cart });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};

// Change product quantity in cart
module.exports.changeProductQuantity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        // Find the cart for the user
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).send({ message: 'Cart not found' });
        }

        // Find the cart item to update
        const cartItem = cart.cartItems.find(item => item.productId.toString() === productId);
        if (!cartItem) {
            return res.status(404).send({ message: 'Product not found in cart' });
        }

        // Get the product to calculate subtotal
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ message: 'Product not found' });
        }

        // Calculate subtotal change
        const subtotalChange = (quantity - cartItem.quantity) * product.price;

        // Update cart item quantity and subtotal
        cartItem.quantity = quantity;
        cartItem.subtotal += subtotalChange;

        // Update total price of the cart
        cart.totalPrice += subtotalChange;

        // Save the changes to the cart
        await cart.save();

        // Respond with success message and updated cart
        res.status(200).send({ message: 'Product quantity updated in cart', cart });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};


// Remove products from Cart
module.exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.productId; // Use req.params to get the product ID from the URL
        
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).send({ message: 'Cart not found' });
        }
        
        const cartItemIndex = cart.cartItems.findIndex(item => item.productId.toString() === productId);
        if (cartItemIndex === -1) {
            return res.status(404).send({ message: 'Product not found in cart' });
        }
        
        const removedItem = cart.cartItems.splice(cartItemIndex, 1)[0]; // Remove the item from the cart
        cart.totalPrice -= removedItem.subtotal; // Update total price
        
        await cart.save();
        
        res.status(200).send({ message: 'Product removed from cart', cart });
    } catch (error) {
        //console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};

// Clear Cart Items
module.exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).send({ message: 'Cart not found' });
        }
        
        cart.cartItems = [];
        cart.totalPrice = 0;
        
        await cart.save();
        
        res.status(200).send({ message: 'Cart cleared successfully', cart });
    } catch (error) {
        //console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};