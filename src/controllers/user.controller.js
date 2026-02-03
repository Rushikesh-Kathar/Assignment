import { registerUser, loginUser, refreshToken, revokeUser } from '../services/authService.js';
import { getAllUsers } from '../services/userService.js';

export const registerUserController = async (req, res) => {
    try {
        const { name, email, age, password, mobile } = req.body;


        const tokens = await registerUser({ name, email, age, password, mobile });

        res.status(201).json({
            message: 'User registered successfully',
            ...tokens
        });
    } catch (error) {
        console.error(error);


        if (error.message === 'Missing required fields' || error.message === 'Email already registered') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ error: 'An internal server error occurred' });
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
        let { token } = req.body;
        let refreshToken = await revokeUser({ token });
        res.json({ refreshToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }

}