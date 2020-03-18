const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, next) => {
	let error = {...err};
	error.message = err.message;
	
	console.log(err);
	
	if (err.code === 301) {
		const message = "Unique constraint violated - Duplicate email address";
		error = new ErrorResponse(message, 404);
	}
	
	if (err.code === 260) {
		const message = "Invalid column name";
		error = new ErrorResponse(message, 404);
	}
	
	if (err.code === 257) {
		const message = "SQL syntax error";
		error = new ErrorResponse(message, 404);
	}
	
	if (err.code === 259) {
		const message = "Invalid table name";
		error = new ErrorResponse(message, 404);
	}
	
	if (err.code === 314) {
		const message = "Numeric overflow";
		error = new ErrorResponse(message, 404);
	}
	
	res.status(error.statusCode || 500).json({success: false, error: error.message || "Server Error"});
};

module.exports = errorHandler;