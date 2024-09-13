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
app.use(express.urlencoded({ extended : true }));
app.use(cors());


//[Section] Google Login
app.use(session({
	secret: process.env.clientSecret,
	resave: false,
	saveUninitialized: false
}));
// Initializes the passport package when the application runs
app.use(passport.initialize());

// Creates a session using the passport package
app.use(passport.session());


// [Section] MongoDB Connection
mongoose.connect("mongodb+srv://admin:admin123@capstone2.dw6qakx.mongodb.net/Demo-App?retryWrites=true&w=majority",
		{
			useNewUrlParser : true,
			useUnifiedTopology : true
		}
);

mongoose.connection.once("open", () => console.log("Now connected to MongoDB Atlas"));

app.use("/b5/users", userRoutes);
app.use("/b5/products", productRoutes);
app.use("/b5/cart", cartRoutes);
app.use("/b5/orders", orderRoutes);


if(require.main === module){

	app.listen(process.env.PORT || port, () => {
		console.log(`API is now online on port ${ process.env.PORT || port }`)
	})

}

module.exports = { 	app, 
					mongoose };
