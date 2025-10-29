const bcrypt = require("bcrypt");
const validator = require("validator");
const User = require("../models/Users");
const auth = require("../auth");
const Product = require("../models/Products");
const { transporter, sendEmail } = require("../nodemailer");

// This module is to create a user
// For additional feature: send email confirmation for successful registration
module.exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, mobileNo, password, address } =
      req.body;

    if (!firstName || !lastName || !email || !mobileNo || !password) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid email format" });
    }

    const mobilePattern = /^09\d{9}$/;
    if (!mobilePattern.test(mobileNo)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid mobile number" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters",
      });
    }

    //Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { mobileNo }] });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Email or mobile number already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new user
    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      mobileNo,
      password: hashedPassword,
      address: address
        ? {
            street: address.street || "",
            apartment: address.apartment || "",
            zip: address.zip || "",
            city: address.city || "",
            country: address.country || "",
          }
        : undefined,
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Registered successfully",
    });
  } catch (err) {
    console.error("Error in registerUser:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

//User Log-In
module.exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Email and password do not match",
      });
    }

    const accessToken = auth.createAccessToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successfully",
      access: accessToken,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//Get User Profile
module.exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.status(200).json({
      success: true,
      message: "Retrieved user profile successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};
//Update User Profile

module.exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, mobileNo, email, address } = req.body;

    // --- 1. Input validation ---
    if (email && !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    if (mobileNo && !/^\d{11}$/.test(mobileNo)) {
      return res.status(400).json({
        success: false,
        error: "Mobile number must be 11 digits",
      });
    }

    if (address && typeof address !== "object") {
      return res.status(400).json({
        success: false,
        error: "Invalid address format",
      });
    }

    // --- 2. Check for duplicate email (exclude self) ---
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: "Email already in use",
        });
      }
    }

    // --- 3. Build update data safely ---
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (mobileNo) updateData.mobileNo = mobileNo;
    if (email) updateData.email = email;

    if (address) {
      updateData.address = {
        street: address.street || "",
        apartment: address.apartment || "",
        zip: address.zip || "",
        city: address.city || "",
        country: address.country || "",
      };
    }

    // --- 4. Update user ---
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // --- 5. Return consistent response ---
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    //console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
};

//Reset Password
module.exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { id } = req.user;

    // Validation
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: "New password is required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long",
      });
    }

    // Optional: Add stronger validation
    // const passwordRegex =
    //   /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    // if (!passwordRegex.test(newPassword)) {
    //   return res.status(400).json({
    //     success: false,
    //     error:
    //       "Password must include uppercase, lowercase, number, and special character",
    //   });
    // }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(id, { password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

module.exports.updateAsAdmin = async (req, res) => {
  const { userId } = req.body;

  try {
    // Prevent self-update
    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot modify your own admin status.",
      });
    }

    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    userToUpdate.isAdmin = true;
    await userToUpdate.save();

    res.status(200).json({
      success: true,
      message: "User updated as admin successfully.",
      user: {
        id: userToUpdate._id,
        email: userToUpdate.email,
        isAdmin: userToUpdate.isAdmin,
      },
    });
  } catch (error) {
    console.error("Error updating user as admin:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};
