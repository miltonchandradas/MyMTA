const express = require("express");
const router = express.Router();
const { getCustomer, getCustomers, addCustomer, updateCustomer, deleteCustomer } = require("../controllers/customers");

router
	.route("/")
	.get(getCustomers)
	.post(addCustomer);
	
	
router
	.route("/:id")
	.get(getCustomer)
	.put(updateCustomer)
	.delete(deleteCustomer);
	

module.exports = router;