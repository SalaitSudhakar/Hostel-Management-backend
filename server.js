import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDb from "./Database/dbConfig.js";
import userRoute from "./Routes/userRoutes.js";
import residentRoute from "./Routes/residentRoutes.js";
import roomRoute from "./Routes/roomRoutes.js";
import bookingRoute from "./Routes/bookingRoutes.js";
import paymentRoute from "./Routes/paymentRoutes.js";
import maintenanceRequestRoute from "./Routes/maintenanceRequestRoutes.js";
import staffRoute from "./Routes/staffRoutes.js";
import expenseRoute from "./Routes/expenseRoutes.js";
import revenueRoute from "./Routes/revenueRoutes.js";
import roomOccupancyRoute from "./Routes/roomOccupancyRoutes.js";
import downloadReportRoute from "./Routes/downloadReportRoutes.js";
import helmet from "helmet";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://*.paypal.com",
          "https://*.paypal.cn",
          "https://*.paypalobjects.com",
          "https://objects.paypal.cn",
          "https://www.recaptcha.net",
          "https://www.gstatic.com",
          "https://*.synchronycredit.com",
          "https://synchronycredit.com",
          "https://www.datadoghq-browser-agent.com",
        ],
      },
    },
  })
);

connectDb();

app.get("/", (req, res) => {
  res.send("Welcome To My Hostel Management System");
});

app.use("/api/auth", userRoute);
app.use("/api/resident", residentRoute);
app.use("/api/room", roomRoute);
app.use("/api/booking", bookingRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/maintenance-request", maintenanceRequestRoute);
app.use("/api/staff", staffRoute);
app.use("/api/expense", expenseRoute);
app.use("/api/revenue", revenueRoute);
app.use("/api/room-occupancy", roomOccupancyRoute);
app.use("/api/download-report", downloadReportRoute);

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`server is started and running on the port`);
});
