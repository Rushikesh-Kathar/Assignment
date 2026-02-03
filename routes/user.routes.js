import Router from "express";
import { registerUser, userGetter, loginUser, refreshToken, revokeUser } from "../controllers/user.controller.js";

import { verifytoken } from "../middleware/authMiddleware.js"

const router = Router();
router.route('/register').post(registerUser);
router.route("/login").post(verifytoken, loginUser);
router.route("/users").get(userGetter);
router.route("/token").post(refreshToken);
router.route("/revoke").post(revokeUser);


export default router;