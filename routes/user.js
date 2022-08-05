// API routes for user-related actions.

import {Router} from 'express';
import {
  registerUser, loginUser, getProfile, grantAdmin, revokeAdmin, wipeResults, deleteUser
} from '../controllers/user.js';

const router = Router();

// User account creation
router.post("/register", registerUser);

// User login
router.post("/login", loginUser);

// Profile data of logged in user.
router.get("/profile", getProfile);

// Profile data of a specific user.
router.get("/profile/:username", getProfile);

// Grant admin privs to a user
router.get("/admin/grant/:username", grantAdmin);

// Revoke admin privs to a user
router.get("/admin/revoke/:username", revokeAdmin);

// For wiping test results of a user
router.delete("/results/:username", wipeResults);

// For deleting a user account
router.delete("/:username", deleteUser);

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  return res.json({success: "You have been logged out!"});
});

export default router;
