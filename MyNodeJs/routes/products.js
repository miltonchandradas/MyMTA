const express = require("express");
const router = express.Router();
const { getProducts, addProduct } = require("../controllers/products");
const { protect } = require("../middleware/auth");

router
	.route("/")
	.get(getProducts)
	.post(protect, addProduct);
	
module.exports = router;