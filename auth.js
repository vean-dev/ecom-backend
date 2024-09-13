require('dotenv').config();
const jwt = require("jsonwebtoken");
const secret = process.env.authSecret;


module.exports.createAccessToken = (user) => {
	const data = {
		id: user._id,
		email: user.email,
		isAdmin: user.isAdmin
	};
	return jwt.sign(data, secret, {});
};


module.exports.verify = (req,res, next) => {

	//console.log(req.headers.authorization);

	let token = req.headers.authorization; 

	if(typeof token === "undefined"){
		return res.send({ auth: "Failed. No token"})
	}
	else{
		//console.log(token); 
		token = token.slice(7, token.length); 
		//console.log(token);

		jwt.verify(token, secret, function(err, decodedToken){

			if(err){
				return res.status(401).send(
				{
					auth: "Failed",
					message: err.message
				});
			}
			else{
				//console.log("result from verify method: ");
				//console.log(decodedToken);
				req.user = decodedToken;

				next(); // run the next middleware
			}
		})
	}
};


module.exports.verifyAdmin = (req, res, next) =>{

	// Checks if the owner of the token is an admin.
	if(req.user.isAdmin){
		next();
	}
	else{
		return res.status(403).send({
			auth: "Failed",
			message: "Action Forbidden"
		})
	}

};


module.exports.isLoggedIn = (req, res, next) => {

	if(req.user){
		next();
	} else {
		res.sendStatus(401);
	}
};