const express = require("express");
const userController = require("../controllers/user");

const passport = require("passport");

const { verify, verifyAdmin, isLoggedIn} = require("../auth");

const router = express.Router();

router.post("/checkEmail", userController.checkEmailExist);

//registration
router.post("/", userController.registerUser);

//login users
router.post("/login", userController.loginUser);

//get user details
router.get("/details", verify, userController.getProfile);

//update password
router.put("/update-password", verify, userController.resetPassword);

//updateProfile
router.put("/profile", verify, userController.updateProfile);

//set-as-admin
router.put('/set-as-admin', verify, verifyAdmin, userController.updateAsAdmin);

//[SECTION] Route for Google OAuth authentication
router.get("/google", 
	passport.authenticate("google", {
		scope: ["email", "profile"],
		prompt: "select_account"

	}
));


//[SECTION] Route for callback URL for Google OAuth authentication
router.get("/google/callback",
	// If authentication is unsuccessful, redirect to "/users/failed" route
	passport.authenticate("google", {
		failureRedirect: "/users/failed"	
	}),
	// If authentication is successful, redirect to "/users/success" route
	function(req, res){
		res.redirect("/users/success");
	}
);

//[SECTION] Route for failed Google OAuth authentication
router.get("/failed", (req,res) => {

	//console.log("User is not authenticated");
	res.send("Failed");

});

//[SECTION] Route for successful Google OAuth authentication
router.get("/success", isLoggedIn, (req,res) => {

	//console.log("You are logged in");
	//console.log(req.user);
	res.send(`Welcome ${req.user.displayName}`);

});

//[SECTION] Route for logging out of the application
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      //console.error("Error while destroying session:", err);
    } else {
      req.logout(() => {
        // Redirects the page to "/"
        //console.log("You are logged out");
        res.redirect("/"); 
      });
    }
  });
});
module.exports = router;