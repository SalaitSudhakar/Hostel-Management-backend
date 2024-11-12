import User from "../Models/userSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import sendEmail from "../Services/mailer.js";

dotenv.config();

// Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    //console.log(hashPassword);
    const newUser = new User({ name, email, password: hashPassword });
    await newUser.save();
    res
      .status(200)
      .json({ message: "User Registered Successfully", data: newUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//login user || signin
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    user.token = token;
    await user.save();
    res
      .status(200)
      .json({ message: "User Logged In Successfully", token: token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    sendEmail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        res
          .status(500)
          .json({ message: "Internal server error in sending the mail" });
      } else {
        res.status(200).json({ message: "Email Sent Successfully" });
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// reset Password
export const resetPassword = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password } = req.body;
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User Not Found" });
      }
      const hashPassword = await bcrypt.hash(password, 10);
      user.password = hashPassword;
      await user.save();
      res.status(200).json({ message: "Password Reset Successfully" });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Update User Role - Only Admins Can Access
export const updateUserRole = async (req, res) => {
    try {
      const { userId, role } = req.body;
  
      // Ensure only Admins can change roles
      if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied: Only Admins can change roles' });
      }
  
      // Update the role of the specified user
      const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({
        message: 'User role updated successfully',
        data: user,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
