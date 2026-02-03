import { conn } from '../config/dbConn.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
    generateAccessToken,
    generateRefreshToken
} from '../../auth.js';

let refreshTokens = [];


export const registerUser = async (userData) => {
    const { name, email, age, password, mobile } = userData;

    if (!name || !email || !password) {
        throw new Error('Missing required fields');
    }

    const [existing] = await conn.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
    );

    if (existing.length > 0) {
        throw new Error('Email already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await conn.execute(
        'INSERT INTO users (name, email, age, password, mobile) VALUES (?,?,?,?,?)',
        [name, email, age, hashedPassword, mobile]
    );

    const tokenUser = { id: result.insertId, email };
    const accessToken = generateAccessToken(tokenUser);
    const refreshToken = generateRefreshToken(tokenUser);

    refreshTokens.push(refreshToken);

    return { accessToken, refreshToken };
};

export const loginUser = async (userData) => {
    const { email, password } = userData;

    if (!email || !password) {
        throw new Error('Please add all fields')
    }


    const [rows] = await conn.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );

    if (rows.length === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const tokenUser = {
        id: user.id,
        email: user.email
    };

    const accessToken = generateAccessToken(tokenUser);
    const refreshToken = generateRefreshToken(tokenUser);
    console.log("Accesstoken", accessToken);
    console.log("Refresh token", refreshToken);
    refreshTokens.push(refreshToken);

    return { accessToken, refreshToken };

};


export const refreshToken = async (userData) => {
    const { token } = userData;

    if (!token) {
        throw new Error("NO_TOKEN");
    }
    if (!refreshTokens.includes(token)) {
        throw new Error("INVALID_TOKEN");
    }

    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) return reject(new Error("FORBIDDEN"));

            const accessToken = generateAccessToken({
                id: user.id,
                email: user.email
            });

            resolve(accessToken);
        });
    });
};


export const revokeUser = async (userData) => {
    let { token } = userData;
    refreshTokens = refreshTokens.filter(t => t !== token);
    console.log("refresh token removed successfully");
}