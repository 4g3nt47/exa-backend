import {Router} from 'express';
import {registerUser, loginUser, userProfile} from '../controllers/user.js';

const router = Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/profile", userProfile);

router.get("/logout", (req, res) => {
  req.session.destroy();
  return res.json({success: "You have been logged out!"});
});

export default router;
