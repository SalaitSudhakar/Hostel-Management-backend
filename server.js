import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDb from './Database/dbConfig.js';


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDb();

app.get("/", (req, res) => {
    res.send("Welcome To My Hostel Management System");
})


const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log("server is started and running on the port")
})