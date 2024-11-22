import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../Models/userSchema.js";
import sendEmail from "../Utils/mailer.js";


// Validate email using regular expression
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Validate password (at least 8 characters, one number, one letter, one special character)
const validatePassword = (password) =>
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&/])[A-Za-z\d@$!%*?&/]{8,}$/.test(password);


// Register a new user
export const registerUser = async (req, res) => {
  const { name, email, phoneNumber, password, role } = req.body;

  // Validate email and password
  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long, contain at least one number, one letter, and one special character",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    /* validate role value before saving */
    const validRoles = ["admin", "resident", "staff"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role provided" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // create a new user object
    const newUser = new User({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      role: role || "resident",
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Login a user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Validate email and password
  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long, contain at least one number, one letter, and one special character",
    });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    
    // Generate a token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );


    // save token to the user
    user.token = token;
    await user.save();

    res.status(200).json({ message: "Login successful", token, role: user.role, userId: user._id });  
  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
  }
};



// Forgot Password - Request Reset
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Validate email and password
  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    const user = await User.findOne({ email }).select("-password");

    // Check if the user exists
    if (!user) {
      return res.status(200).json({
        message: "User is not registered.",
      });
    }

    // Generate a reset token
    const resetToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });

    await user.save();

    // Email details and content
    const subject = "Password Reset Link";
    const resetUrl = `http://localhost:5173/reset-password/${user._id}/${resetToken}`;
    const html = `
      <p>You recently requested to reset the password for your account.</p>
      <p>Click the button below to proceed:</p>
      <a href="${resetUrl}" 
         style="
           display: inline-block;
           background-color: #ea580c;
           color: white;
           padding: 10px 20px;
           text-align: center;
           text-decoration: none;
           border-radius: 5px;
           font-size: 16px;
           margin-top: 6px;
           
         "
         target="_blank" 
       >
         Reset Password
      </a>
      <p>This link is valid for 30 minutes. If you did not request a password reset, please ignore this email.</p>
    `;

    // Send reset password link
    try {
      await sendEmail(email, subject, html);
      return res.status(200).json({ message: "Email sent successfully" });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res.status(500).json({
        message: "Failed to send password reset email. Please try again later.",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Reset Password
export const resetPassword = async (req, res) => {
  const { id, resetToken } = req.params;
  const { password } = req.body;


  // Validate required fields
  if (!resetToken) {
    return res.status(400).json({ message: "Token is missing." });
  }
  if (!password) {
    return res.status(400).json({ message: "Password is missing." });
  }

  // Optional: Simplify the password validation or customize it
  const validatePassword = (password) => 
    /^(?=.*[A-Za-z])(?=.*\d|.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(password); // At least one letter, and one number or special character.

  if (!validatePassword(password)) {
    return res.status(400).json({
      message: "Password must contain at least one letter and one number or special character.",
    });
  }

  try {
    // Verify the reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    // Check if the user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: "Invalid token or user does not exist." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;

    // Save the updated user record
    await user.save();

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    // Handle JWT or database errors
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Invalid or expired token." });
    }
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Error resetting password. Please try again later." });
  }
};
