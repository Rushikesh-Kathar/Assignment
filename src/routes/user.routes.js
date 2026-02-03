import Router from "express";
import { registerUserController, userGetter, loginUserController, refreshTokenController, revokeUserController } from "../controllers/user.controller.js";



const router = Router();
router.route('/register').post(registerUserController);
router.route("/login").post(loginUserController);
router.route("/users").get(userGetter);
router.route("/token").post(refreshTokenController);
router.route("/revoke").post(revokeUserController);


export default router;