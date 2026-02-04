import { registerUser, loginUser, refreshToken, revokeUser } from '../services/authService.js';
import { getAllUsers } from '../services/userService.js';

export const registerUserController = async (req, res) => {
    try {
        const { name, email, age, password, mobile, teamId, roleId } = req.body;


        if (!name || !email || !password || !teamId || !roleId) {
            return res.status(400).json({ message: "Missing required fields" });
        }


        const tokens = await registerUser({ name, email, age, password, mobile, teamId, roleId });

        res.status(201).json({
            message: 'User registered successfully',
            ...tokens
        });
    } catch (error) {
        console.error(error);


        if (error.message === 'Missing required fields' || error.message === 'Email already registered') {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({
            message: error.message,
            sqlMessage: error.sqlMessage,
            code: error.code
        });
    }
};

export const loginUserController = async (req, res) => {
    try {
        const { email, password } = req.body;
        const tokens = await loginUser({ email, password });

        res.status(200).json({
            message: 'Login successful',
            ...tokens
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const userGetter = async (req, res) => {
    try {
        const users = await getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const refreshTokenController = async (req, res) => {
    try {
        const { token } = req.body;

        const newToken = await refreshToken({ token });
        res.json({ accessToken: newToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }

};

export const revokeUserController = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        await revokeUser({ userId });

        res.json({ message: "User revoked and tokens deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

