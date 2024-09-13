
const Product = require("../models/Products");

// Search Product by Name
module.exports.searchProducts = async (req, res) => {
    try {
        const { productName } = req.body;

        if (!productName) {
            return res.status(400).send({ message: 'productName is required in the request body' });
        }

        const products = await Product.find({
            name: { $regex: productName, $options: 'i' }
        });

        res.send(products);
    } catch (error) {
        res.status(500).send({ error: 'Internal Server Error' });
    }
};

// Search Product by Price Range
module.exports.searchProductsByPriceRange = async (req, res) => {
    try {
        const { minPrice, maxPrice } = req.body;

        if (!minPrice || !maxPrice) {
            return res.status(400).send({ error: 'Both minPrice and maxPrice are required' });
        }

        const results = await Product.find({ price: { $gte: minPrice, $lte: maxPrice } });

        return res.status(200).send({ results });
    } catch (error) {
        //console.error('Error in product search by price range:', error);
        return res.status(500).send({ error: 'Internal server error' });
    }
};


//AddProduct
module.exports.addProduct = (req, res) => {

    try {

        let newProduct = new Product({
            name : req.body.name,
            description : req.body.description,
            price : req.body.price,
            countInStock: req.body.countInStock

        });

        Product.findOne({ name: req.body.name })
            .then(existingProduct => {
                if(existingProduct){
                    return res.status(409).send({ error: "Product already exist"})
                }
                return newProduct.save()
                        .then(result => res.status(201).send({ result }))
                        .catch(err => {
                            //console.log("Error in saving the Product:", err);
                            return res.status(500).send({ error: "failed to save the Product"})
                        });
            }).catch(err =>{
                //console.error("Error in finding product: ",err);
                return res.status(500).send({message: "Error in finding the product"});
            })

    } catch (err) {
        //console.error("Error in finding product: ", err);
        return res.status(500).send({ message: "Error in getting the variables" });
    }
    
};


//Get all Product
module.exports.getAllProduct = (req, res) => {

    return Product.find({})
    .then(products => {
        if(products.length > 0){
            return res.status(200).send({ products });
        }
        else{
            return res.status(200).send({ message: "No Product found." });
        }

    })
    .catch(err => {
        //console.error("Error in finding all Product", err);
        return res.status(500).send({ error: "Error finding Product" });

    });

};

//Get All Active Product
module.exports.getAllActive = (req, res) => {

    Product.find({ isActive: true })
    .then(products => {
        if (products.length > 0){
            return res.status(200).send({ products });
        }
        else {
            return res.status(200).send({message: "There are no Product at the moment."})
        }
    })
    .catch(err => res.status(500).send({ error: "Error in finding active Product"}));

};

//Get Product
module.exports.getProduct = (req, res) => {
    Product.findById(req.params.productId)
        .then(product => {
            if (product) {
                res.status(200).send({ product });
            } else {
                res.status(404).send({ error: 'Product not found' });
            }
        })
        .catch(err => {
            //console.log(err);
            res.status(500).send({ error: 'Failed to fetch product' });
        });
};


//Update Product
module.exports.updateProduct = (req, res)=>{

    let productId = req.params.productId;

    let updatedProduct = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        countInStock: req.body.countInStock


    }

    return Product.findByIdAndUpdate(productId, updatedProduct, { new: true })
    .then(product => {
        if (product) {
            res.status(200).send({ 
                message: "Product updated successfully",
                updatedProduct: product
                });
        } else {
            res.status(404).send({ error: "failed to update product" });
        }
    })
    .catch(err => {
        //console.error("Error in updating product", err);
        return res.status(500).send({ error: "Error in updating product"})
    });
};

//Archive Product
module.exports.archiveProduct = (req, res) => {

  let updateActiveField = {
    isActive: false,
  };

  if(req.user.isAdmin == true){

    return Product.findByIdAndUpdate(req.params.productId, updateActiveField , { new: true })
      .then((product) => {
        if (product) {
          res.status(200).send({ archiveProduct: { message: 'Product archived successfully', product } });
        } else {
          res.status(404).send({ error: 'Product not found' });
        }
      })
      .catch((err) => res.status(500).send({ error: 'Failed to activate a product', details: err }));

  } else {

    return res.status(403).send({ error: 'Unauthorized', message: 'You do not have permission to archive a product' });

  }

};

module.exports.activateProduct = (req, res) => {
  let updateActiveField = {
    isActive: true,
  };

  if (req.user.isAdmin == true) {
    return Product.findByIdAndUpdate(req.params.productId, updateActiveField, { new: true })
      .then((product) => {
        if (product) {
          res.status(200).send({ activateProduct: { message: 'Product activated successfully', product } });
        } else {
          res.status(404).send({ error: 'Product not found' });
        }
      })
      .catch((err) => res.status(500).send({ error: 'Failed to activate a product', details: err }));
  } else {
    return res.status(403).send({ error: 'Unauthorized', message: 'You do not have permission to activate a product' });
  }
};

