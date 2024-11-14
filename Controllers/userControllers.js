import User from "../Models/userSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import sendEmail from "../Services/mailer.js";

dotenv.config();

// Helper function to hash password
const hashPassword = async (password) => await bcrypt.hash(password, 10);

// Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, role, address, gender, dateOfBirth, emergencyContact } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already in use" });
    }

    //console.log(hashPassword);
    const newUser = new User({
      name,
      email,
      password: await hashPassword(password),
      phoneNumber,
      emergencyContact,
      gender,
      dateOfBirth,
      role, 
      address,

    });
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

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
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
    const resetToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const resetLink = `https://password-reset-project-reactjs.netlify.app/reset-password/${user._id}/${resetToken}`
    const subject = "Password Reset Link";
    const html = `
    <p>You recently requested to reset the password for your account.</p>
    <p>Click the link below to proceed</p>
    <a href="${resetLink}">Click Here</a>
    <p>This link is valid for 30 minutes. If you did not request a password reset, please ignore this email.</p>
    `;

    sendEmail(user.email, subject, html, function (error, info) {
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

      user.password = await hashPassword(password);
      await user.save();
      res.status(200).json({ message: "Password Reset Successfully" });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}