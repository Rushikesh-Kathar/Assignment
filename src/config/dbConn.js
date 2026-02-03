import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
export const conn = await mysql.createPool({
    connectionLimit: process.env.CONNECTIONLIMIT,
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

conn.getConnection((err, connection) => {
    if (err) {
        console.error("DB connection failed:", err);
        process.exit(1);
    } else {
        console.log("DB connected successfully!");
        connection.release();
    }
});