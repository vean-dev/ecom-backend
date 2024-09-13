const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price : {
        type: Number,
        default: 0,
        required: true
    },
    countInStock: {
        type: Number,
        required: true,
        min: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdOn: {
        type: Date,
        default: Date.now,
    },
})

productSchema.index({ name: 'text' });

module.exports = mongoose.model("Product", productSchema);