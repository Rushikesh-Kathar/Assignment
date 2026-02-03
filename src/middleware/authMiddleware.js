import jwt from 'jsonwebtoken';

export const verifytoken = (req, res, next) => {
    let token;
    let authheader = req.headers.Authorization || req.headers.authorization;
    if (authheader && authheader.startsWith("Bearer")) {
        token = authheader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "No token, Authorization denied!" });
        }

        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decode;
            console.log("the decoded user is", req.user);
            next();
        } catch (err) {
            res.status(400).json({
                message: "Token is not valid"
            })
        }
    }
}

