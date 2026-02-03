import express from "express";
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import userRouter from './routes/user.routes.js';
dotenv.config();

const app = express();
const port = 3000;

export const conn = await mysql.createPool({
    connectionLimit: 10,
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/", userRouter);

conn.getConnection((err, connection) => {
    if (err) {
        console.error("DB connection failed:", err);
        process.exit(1);
    } else {
        console.log("DB connected successfully!");
        connection.release();
    }
});

app.get("/test", (req, res) => {
    res.send("Server is alive!");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});