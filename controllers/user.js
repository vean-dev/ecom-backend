const bcrypt = require('bcrypt');
const User = require("../models/Users");
const auth = require("../auth");
const Product = require("../models/Products");
const { transporter, sendEmail } = require('../nodemailer');

//Check Email if Existing
module.exports.checkEmailExist = (req,res) => {
	if (req.body.email.includes("@")) {
	  return User.find({ email: req.body.email })
	    .then(result => {
	      if (result.length > 0) {
	        return res.status(409).send({ error: 'Duplicate Email Found' });
	      } else {
	        return res.status(404).send({ message: 'Email not found' });
	      }
	    })
	    .catch(err => res.status(500).send({ error: 'Error in Find', details: err }));
	} else {
	  return res.status(400).send({ error: 'Bad Request', message: 'Invalid email format' });
	}	
};

//Register User
module.exports.registerUser = (req, res) => {
    if (!req.body.email.includes("@")) {
        return res.status(400).send({ error: 'Email invalid' });
    } else if (req.body.mobileNo.length !== 11) {
        return res.status(400).send({ error: 'Mobile number invalid' });
    } else if (req.body.password.length < 8) {
        return res.status(400).send({ error: 'Password must be at least 8 characters' });
    } else {
        let newUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            mobileNo: req.body.mobileNo,
            password: bcrypt.hashSync(req.body.password, 10)
        });
        return newUser.save()
            .then(user => {
                // Send welcome email to new user
                const emailSubject = 'Welcome to Our App!';
                const emailText = 'Thank you for registering with us.';
                sendEmail(user.email, emailSubject, emailText);

                return res.status(201).send({
                    message: 'Registered successfully'
                });
            })
            .catch(err => {
                //console.error("Error in Save:", err);
                return res.status(500).send({ error: "Error in Save" });
            });
    }
};

//User Log-In
module.exports.loginUser = (req,res) => {
	if(req.body.email.includes("@")){
		return User.findOne({ email : req.body.email })
		.then(result => {
			if(result == null){
				return res.status(404).send({ error: "No Email Found"});

			} else {
				const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password);

				if (isPasswordCorrect) {

					return res.status(200).send({ access : auth.createAccessToken(result)});

				} else {

					return res.status(401).send({ error: "Email and password do not match"});

				}

			}

		})
		.catch(err => {
			//console.error("Error in find:", err);
			return res.status(500).send({ error: "Error in find"})
		});

	} else {
		return res.status(400).send({ error: "Invalid in email"});
	}	
};


//Get User Profile
module.exports.getProfile = (req, res) => {
	return User.findById(req.user.id)
	.then(user => {
		if (user) {
			user.password = "";
			return res.status(200).send({ user });
		} else {
			return res.status(404).send({ error: 'User not found'});
		}

	})
	.catch(err => {
		//console.error("Failed to fetch user profile:", err)
		return res.status(500).send({ error: "Failed to fetch user profile"});
	})
};


//Update User Profile
module.exports.updateProfile = async (req, res) => {
  try {
  	console.log(req.body);
  	console.log(req.user);

    const userId = req.user.id;

    const { firstName, lastName, mobileNo, email,  street, apartment, zip, city, country  } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, mobileNo, email, street, apartment, zip, city, country  },
      { new: true }
    );

    res.send(updatedUser);
  } catch (error) {
    //console.error(error);
    res.status(500).send({ message: 'Failed to update profile' });
  }
}


//Reset Password
module.exports.resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const { id } = req.user;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(id, { password: hashedPassword });

        // Send notification to user's email
        const emailSubject = 'Password Reset Confirmation';
        const emailText = 'Your password has been successfully reset.';
        sendEmail(req.user.email, emailSubject, emailText);

        res.status(200).send({ message: 'Password reset successfully' });
    } catch (error) {
        //console.error(error);
        res.status(500).send({ message: 'Internal server error' });
    }
};

//Update User As Admin(Admin Only)
module.exports.updateAsAdmin = async (req, res) => {
    const { userId } = req.body;

    try {
        const isAdmin = req.user.isAdmin;

        if (!isAdmin) {
            return res.status(403).send({ message: 'Access denied. Only admin users can perform this action.' });
        }

        const userToUpdate = await User.findById(userId);

        if (!userToUpdate) {
            return res.status(404).send({ message: 'User not found' });
        }

        userToUpdate.isAdmin = true;

        await userToUpdate.save();

        res.status(200).send({ message: "User updated as admin successfully" });
    } catch (error) {
        //console.error(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

