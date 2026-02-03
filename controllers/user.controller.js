import { conn } from '../server.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
    generateAccessToken,
    generateRefreshToken
} from '../auth.js';


let refreshTokens = [];


export const registerUser = async (req, res) => {
    const { name, email, age, password, mobile } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {

        const [existing] = await conn.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await conn.execute(
            'INSERT INTO users (name, email, age, password, mobile) VALUES (?,?,?,?,?)',
            [name, email, age, hashedPassword, mobile]
        );

        const tokenUser = {
            id: result.insertId,
            email
        };

        const accessToken = generateAccessToken(tokenUser);
        const refreshToken = generateRefreshToken(tokenUser);

        refreshTokens.push(refreshToken);

        res.status(201).json({
            message: 'User registered successfully',
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    try {
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

        res.status(200).json({
            message: 'Login successful',
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


export const userGetter = async (req, res) => {
    try {
        const [rows] = await conn.execute(
            'SELECT id, name, email, age, mobile FROM users'
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


export const refreshToken = (req, res) => {
    const { token } = req.body;

    if (!token) return res.sendStatus(401);
    if (!refreshTokens.includes(token)) return res.sendStatus(403);

    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);

        const accessToken = generateAccessToken({
            id: user.id,
            email: user.email
        });

        res.json({ accessToken });
    });
};


export const revokeUser = (req, res) => {
    const { token } = req.body;
    refreshTokens = refreshTokens.filter(t => t !== token);
    console.log("refresh token removed successfully");
    res.sendStatus(204);
}