const router = require('express').Router();
const {
  registerUser, loginUser, userProfile
} = require('../controllers/user');

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/profile", userProfile);

router.get("/logout", (req, res) => {
  req.session.destroy();
  return res.json({success: "You have been logged out!"});
});

module.exports = router;
