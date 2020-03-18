const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const uuidv4 = require('uuid/v4');

// @desc	Get all products
// @route	GET /api/v1/products
// @access	Public
exports.getProducts = asyncHandler(async (req, res, next) => {

	const dbClass = require("../utils/dbPromises");
	let db = new dbClass(req.db);
	
	const sql = `SELECT * FROM "Product"`;
	console.log(sql);
	
	const statement = await db.preparePromisified(sql);
	
	const results = await db.statementExecPromisified(statement, []);
	
	res.status(200).json({success: true, data: results});
			
});



// @desc	Add product
// @route	POST /api/v1/products
// @access	Private
exports.addProduct = asyncHandler(async (req, res, next) => {
	
	console.log(req.body);
	req.body.id = uuidv4();

	const dbClass = require("../utils/dbPromises");
	let db = new dbClass(req.db);
	
	const sql = `INSERT INTO "Product" VALUES (?)`;
	console.log(sql);
	
	const statement = await db.preparePromisified(sql);
	
	const results = await db.statementExecPromisified(statement, [JSON.stringify(req.body)]);
	
	res.status(201).json({success: true, message: "Successfully added product to database..."});
	
});