import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDb from './Database/dbConfig.js';
import userRoute from './Routes/userRoutes.js';
import roomRoute from './Routes/roomRoutes.js';
import bookingRoute from './Routes/bookingRoute.js';
import maintenanceRequestRoute from './Routes/maintenanceRequestRoute.js';
import billingRoute from './Routes/billingRoute.js';    
import revenueRoute from './Routes/revenueRoute.js';
import expenseRoute from './Routes/expenseRoute.js';


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDb();

app.get("/", (req, res) => {
    res.send("Welcome To My Hostel Management System");
})

app.use('/api/auth', userRoute);
app.use('/api/rooms', roomRoute);
app.use('/api/booking', bookingRoute);
app.use('/api/maintenance', maintenanceRequestRoute);
app.use('/api/billing', billingRoute);
app.use('/api/revenue', revenueRoute);
app.use('/api/expense', expenseRoute);

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log("server is started and running on the port")
})