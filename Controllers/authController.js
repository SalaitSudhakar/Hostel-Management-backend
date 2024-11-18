import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/userSchema.js";

// Register a new user
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
  }
};

// Login a user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
  }
};

// Forgot Password - Request Reset
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select("-password");

    if (!user) {
      return res.status(200).json({
        message:
          "If this email is registered, you will receive a password reset link.",
      });
    }

    /* Generate Random string using crypto module for more security */
    const resetToken = randomBytes(32).toString("hex");
    /* Time in milliseconds since 1970 jan 1 */
    const resetTokenExpiration = Date.now() + 1800000; //Expiration time in milliseconds

    user.resetToken = resetToken;
    user.resetTokenExpiration = resetTokenExpiration;
    await user.save();

    // Email details and content
    const subject = "Password Reset Link";
    const text = `You recently requested to reset the password for your account.\n
    Click the link below to proceed:\n
    https://password-reset-project-reactjs.netlify.app/reset-password/${user._id}/${resetToken}\n
    This link is valid for 30 minutes. If you did not request a password reset, please ignore this email.`;

    // Send reset password link
    try {
      await sendEmail(email, subject, text);
      return res.status(200).json({ message: "Email sent successfully" });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res
        .status(500)
        .json({
          message:
            "Failed to send password reset email. Please try again later.",
        });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Missing required fields" });
    };
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password" });
  }
};
