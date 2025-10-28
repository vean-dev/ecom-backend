// [Section] Modules and Dependencies
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

// [Section] Google Login
const passport = require("passport");
const session = require("express-session");
require("./passport");

const cors = require("cors");

const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");

const port = 4005;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

//[Section] Google Login
app.use(
  session({
    secret: process.env.CLIENT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
// Initializes the passport package when the application runs
app.use(passport.initialize());

// Creates a session using the passport package
app.use(passport.session());

// [Section] MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected on Mongo Database"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/v1/users", userRoutes);
app.use("/v1/products", productRoutes);
app.use("/v1/cart", cartRoutes);
app.use("/v1/orders", orderRoutes);

if (require.main === module) {
  app.listen(process.env.PORT || port, () => {
    console.log(`API is now online on port ${process.env.PORT || port}`);
  });
}

module.exports = { app, mongoose };
