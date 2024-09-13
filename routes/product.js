const express = require("express");
const productController = require("../controllers/product");
const auth = require("../auth");
const {verify, verifyAdmin} = auth;

const router = express.Router();

// [Section] Search product by name
router.post("/searchByName", productController.searchProducts);

// [Section] Search product by price
router.post("/searchByPrice", productController.searchProductsByPriceRange);

router.post("/", verify, verifyAdmin, productController.addProduct);

router.get("/all", verify, verifyAdmin, productController.getAllProduct);

router.get("/active", productController.getAllActive);

router.get("/:productId", productController.getProduct);

router.patch("/:productId", verify, verifyAdmin, productController.updateProduct);

router.patch("/archive/:productId", verify, verifyAdmin, productController.archiveProduct);

router.patch("/activate/:productId", verify, verifyAdmin, productController.activateProduct);


module.exports = router;