const Product = require("../models/Products");

// Search Product by Name
module.exports.searchProducts = async (req, res) => {
  try {
    const { productName } = req.body;

    if (!productName) {
      return res
        .status(400)
        .json({ message: "Product Name is required in the request body" });
    }

    const products = await Product.find({
      name: { $regex: productName, $options: "i" },
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.searchProductsByPriceRange = async (req, res) => {
  try {
    let { minPrice, maxPrice } = req.body;

    minPrice = parseFloat(minPrice);
    maxPrice = parseFloat(maxPrice);

    if (isNaN(minPrice) || isNaN(maxPrice)) {
      return res.status(400).json({
        success: false,
        message: "minPrice and maxPrice must be valid numbers",
      });
    }

    if (minPrice > maxPrice) {
      return res.status(400).json({
        success: false,
        message: "minPrice cannot be greater than maxPrice",
      });
    }

    const results = await Product.find({
      price: { $gte: minPrice, $lte: maxPrice },
      isActive: true,
    });

    if (!results.length) {
      return res.status(200).json({
        success: true,
        message: "No products found within the specified price range.",
        results: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Products found within price range.",
      results,
    });
  } catch (error) {
    console.error("Error in product search by price range:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while searching products.",
    });
  }
};

// Add Products Module
module.exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, countInStock } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "Name and description are required.",
      });
    }

    if (price < 0 || countInStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Price and countInStock cannot be negative.",
      });
    }

    const existingProduct = await Product.findOne({ name: name.trim() });
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product already exists.",
      });
    }

    const newProduct = new Product({
      name: name.trim(),
      description,
      price,
      countInStock,
    });

    const savedProduct = await newProduct.save();

    return res.status(201).json({
      success: true,
      message: "Product added successfully.",
      data: savedProduct,
    });
  } catch (error) {
    console.error("Error in addProduct:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//Get all Product
module.exports.getAllProduct = async (req, res) => {
  try {
    const products = await Product.find().lean();

    if (!products.length) {
      return res
        .status(200)
        .json({ success: true, message: "No product found." });
    }
    return res.status(200).json({
      success: true,
      message: "All products retrieved",
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//Get All Active Product
module.exports.getAllActive = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).lean();

    if (!products.length) {
      return res
        .status(200)
        .json({ success: true, message: "No product found." });
    }
    return res.status(200).json({
      success: true,
      message: "All active products retrieved",
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//Get Product
module.exports.getProduct = async (req, res) => {
  const product = await Product.findById(req.params.productId);

  try {
    if (!product) {
      return res
        .status(200)
        .json({ success: true, message: "No product found." });
    }
    return res.status(200).json({
      success: true,
      message: "Product retrieved",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//Update Product
module.exports.updateProduct = async (req, res) => {
  const product = req.params.productId;

  const updatedProductData = {
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    countInStock: req.body.countInStock,
  };

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      product,
      updatedProductData,
      {
        new: true,
      }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .send({ success: false, message: "Product update failed" });
    }
    return res.status(200).send({
      success: true,
      message: "Product updated successfuly",
      updatedProduct,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//Archive Product
module.exports.archiveProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const archivedProduct = await Product.findByIdAndUpdate(
      productId,
      { isActive: false },
      { new: true }
    );

    if (!archivedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product archived successfully.",
      product: archivedProduct,
    });
  } catch (error) {
    // console.error("Error archiving product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Activating Products
module.exports.activateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const activatedProduct = await Product.findByIdAndUpdate(
      productId,
      { isActive: true },
      { new: true }
    );

    if (!activatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product activated successfully.",
      product: activatedProduct,
    });
  } catch (error) {
    // console.error("Error activating product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
