// API routes for user-related actions.

import {Router} from 'express';
import {registerUser, loginUser, getProfile} from '../controllers/user.js';

const router = Router();

// User account creation
router.post("/register", registerUser);

// User login
router.post("/login", loginUser);

// Profile data
router.get("/profile", getProfile);

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  return res.json({success: "You have been logged out!"});
});

export default router;
