import jwt from "jsonwebtoken";
import User from "../Models/userSchema.js";
import dotenv from "dotenv";

dotenv.config();

// Authentication Middleware
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token is missing. Authorization denied." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded._id).select("-password");

    if (!req.user) {
      return res.status(404).json({ message: "hello" });
    }

    next();
  } catch (error) {
    const isTokenExpired = error.name === "TokenExpiredError";
    res.status(401).json({
      message: isTokenExpired ? "Token expired. Please login again." : "Invalid token.",
    });
  }
};

// Role-based Middleware
export const roleMiddleware = (role1, role2=null) => (req, res, next) => {
  if (req.user.role !== role1 && req.user.role !== role2) {
    return res.status(403).json({ message: `Access denied. only ${role1} or ${role2} can access this page.` });
  }
  next();
};
