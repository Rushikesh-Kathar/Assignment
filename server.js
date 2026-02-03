import express from "express";
import dotenv from 'dotenv';
import userRouter from '../Mysql_Connection/src/routes/user.routes.js';
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", userRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});