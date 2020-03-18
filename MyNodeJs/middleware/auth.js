const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const ErrorResponse = require("../utils/errorResponse");

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
	let token;
	
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
		token = req.headers.authorization.split(" ")[1];
	} /*else if (req.cookies.token) {
		token = req.cookies.token;
	}*/
	
	// Check if token exists
	if (!token) {
		return next (new ErrorResponse("Not authorized to access this route", 401));
	}
	
	
	try {
		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		console.log(decoded);
		
		// Check for user
		const dbClass = require("../utils/dbPromises");
		let db = new dbClass(req.db);
		
		const sql = `SELECT * FROM "User" WHERE "email" = ?`;
		console.log(sql);
		
		const statement = await db.preparePromisified(sql);
		
		const results = await db.statementExecPromisified(statement, [decoded.email]);
		
		console.log(results);
		
		req.user = results[0];
		
		next();
		
	} catch (err) {
		return next (new ErrorResponse("Not authorized to access this route", 401));
	}
})