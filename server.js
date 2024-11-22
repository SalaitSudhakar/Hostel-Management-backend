import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDb from './Database/dbConfig.js';
import authRoute from './Routes/authRoutes.js';
import maintenanceRequestRoute from './Routes/maintenanceRequestRoutes.js';
import residentRoute from './Routes/residentRoute.js';
import roomRoute from './Routes/roomRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDb();

app.get("/", (req, res) => {
    res.send("Welcome To My Hostel Management System");
})

app.use("/api/auth", authRoute);
app.use("/api/maintenance-requests", maintenanceRequestRoute);  
app.use('/api/resident', residentRoute);
app.use('/api/room', roomRoute)

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log("server is started and running on the port")
})