import jwt from 'jsonwebtoken';
import { conn } from '../config/dbConn.js';

export const verifytoken = async (req, res, next) => {
    let token;
    let authheader = req.headers.Authorization || req.headers.authorization;
    if (authheader && authheader.startsWith("Bearer")) {
        token = authheader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "No token, Authorization denied!" });
        }

        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            // console.log("Decoded token:", decoded);
            const [rows] = await conn.execute(
                "SELECT * FROM auth_tokens WHERE access_token = ? AND user_id = ?",
                [token, decoded.id]
            );
            console.log("Token rows:", rows);
            if (rows.length === 0) {
                return res.status(403).json({ message: "Invalid token" });
            }

            req.user = decoded;
            next();
        } catch (err) {
            console.log(err)
            res.status(400).json({
                message: "Token is not valid"
            })
        }
    }
}

