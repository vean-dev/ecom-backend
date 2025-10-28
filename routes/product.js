const express = require("express");
const productController = require("../controllers/product");
const auth = require("../auth");
const { verify, verifyAdmin } = auth;

const router = express.Router();

// [Section] Search product by name
router.post("/search-by-name", productController.searchProducts);

// [Section] Search product by price
router.post("/search-by-price", productController.searchProductsByPriceRange);

// Get All active Products
router.get("/active", productController.getAllActive);

// Get Products By ID
router.get("/:productId", productController.getProduct);

// For Admin Only
// Add Product Route
router.post("/", verify, verifyAdmin, productController.addProduct);

// Get All Products Route
router.get("/", verify, verifyAdmin, productController.getAllProduct);

// Update Product Route
router.patch(
  "/:productId",
  verify,
  verifyAdmin,
  productController.updateProduct
);

router.patch(
  "/archive/:productId",
  verify,
  verifyAdmin,
  productController.archiveProduct
);

router.patch(
  "/activate/:productId",
  verify,
  verifyAdmin,
  productController.activateProduct
);

module.exports = router;
