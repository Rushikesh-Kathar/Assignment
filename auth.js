
import jwt from 'jsonwebtoken'

export const generateAccessToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.TIMEGENERATEACCESS
    });
};

export const generateRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.TIMEGENERATEREFRESH
    });
};


