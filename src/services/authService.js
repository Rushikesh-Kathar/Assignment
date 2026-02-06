import { conn } from '../config/dbConn.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
    generateAccessToken,
    generateRefreshToken
} from '../../auth.js';
import { ulid } from 'ulid';


let refreshTokens = [];

export const registerUser = async (userData) => {
    const { name, email, age, password, mobile, teamId, roleId } = userData;

    if (!name || !email || !password || !teamId || !roleId) {
        throw new Error('Missing required fields');
    }

    const connection = await conn.getConnection();

    try {
        await connection.beginTransaction();


        const [existing] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            throw new Error('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = ulid();


        await connection.execute(
            'INSERT INTO users (id, name, email, age, password, mobile, roleId) VALUES (?,?,?,?,?,?,?)',
            [userId, name, email, age, hashedPassword, mobile, roleId]
        );


        await connection.execute(
            'INSERT INTO teams_members (MemberID, TeamID) VALUES (?, ?)',
            [userId, teamId]
        );


        await connection.execute(
            'INSERT INTO teams_roles (MemberID, roleID) VALUES (?, ?)',
            [userId, roleId]
        );

        const [roleResult] = await connection.execute(
            'SELECT roleName FROM roles WHERE roleID = ?',
            [roleId]
        );

        const roleName = roleResult[0].roleName;

        const tokenUser = {
            id: userId,
            email,
            role: roleName
        };
        const accessToken = generateAccessToken(tokenUser);
        const refreshToken = generateRefreshToken(tokenUser);


        console.log("Inserting refresh token for user:", userId, "Token:", refreshToken);
        try {
            const result = await connection.execute(
                `INSERT INTO auth_tokens (id, user_id, access_token, refresh_token)
   VALUES (?, ?, ?, ?)`,
                [ulid(), userId, accessToken, refreshToken]
            );
            console.log("Refresh token insert result:", result);
            console.log("Full result object:", JSON.stringify(result, null, 2));
        } catch (tokenError) {
            console.error("Error inserting refresh token:", tokenError.message);
            console.error("Error Code:", tokenError.code);
            console.error("SQL State:", tokenError.sqlState);
            throw tokenError;
        }

        await connection.commit();
        console.log("Transaction committed successfully");

        refreshTokens.push({
            userId: userId,
            token: refreshToken
        });
        return { accessToken, refreshToken };

    } catch (err) {
        await connection.rollback();

        console.error("DB ERROR:", err);
        console.error("SQL Message:", err.sqlMessage);
        console.error("SQL State:", err.sqlState);
        console.error("Error Code:", err.code);

        throw err;
    }
    finally {
        connection.release();
    }
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
        throw new Error("Invalid credentials");
    }


    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    const tokenUser = {
        id: user.id,
        email: user.email
    };
    const accessToken = generateAccessToken(tokenUser);
    const refreshToken = generateRefreshToken(tokenUser);

    console.log("Inserting refresh token for user:", user.id, "Token:", refreshToken);
    try {
        const result = await conn.execute(
            "INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)",
            [user.id, refreshToken]
        );
        console.log("Refresh token insert result:", result);
        console.log("Full result object:", JSON.stringify(result, null, 2));
    } catch (insertError) {
        console.error("Error inserting refresh token:", insertError.message);
        console.error("Error Code:", insertError.code);
        console.error("SQL State:", insertError.sqlState);
        console.error("Full error:", insertError);
        throw insertError;
    }

    console.log("Accesstoken", accessToken);
    console.log("Refresh token", refreshToken);
    refreshTokens.push({
        userId: user.id,
        token: refreshToken
    });

    console.log(refreshTokens);
    return { accessToken, refreshToken };

};

export const refreshToken = async (userData) => {
    const { token } = userData;

    if (!token) throw new Error("NO_TOKEN");

    const [rows] = await conn.execute(
        "SELECT * FROM refresh_tokens WHERE token = ?",
        [token]
    );

    if (!rows.length) throw new Error("INVALID_TOKEN");

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

export const revokeUser = async ({ userId }) => {
    console.log("Revoking userId:", userId);


    const connection = await conn.getConnection();
    try {
        await connection.beginTransaction();

        console.log('Deleting refresh token rows for user:', userId);
        const [delTokens] = await connection.execute(
            'DELETE FROM refresh_tokens WHERE user_id = ?',
            [userId]
        );



        console.log('Deleting user row:', userId);
        const [delUser] = await connection.execute(
            'DELETE FROM users WHERE id = ?',
            [userId]
        );

        await connection.commit();

        refreshTokens = refreshTokens.filter(rt => rt.userId !== userId);

        return { tokens: delTokens.affectedRows, users: delUser.affectedRows };
    } catch (error) {
        await connection.rollback();
        console.error('Error revoking user, transaction rolled back:', error);
        throw error;
    } finally {
        connection.release();
    }
};
