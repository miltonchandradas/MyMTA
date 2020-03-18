const express = require("express");
const router = express.Router();
const { getMe, register, login, logout } = require("../controllers/auth");
const { protect } = require("../middleware/auth");

router
	.route("/me")
	.get(protect, getMe);

router
	.route("/register")
	.post(register);
	
router
	.route("/login")
	.post(login);
	
router
	.route("/logout")
	.get(logout);
	
module.exports = router;