const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const geocoder = require("../utils/geocoder");
const Isochrones = require("../utils/isochrones");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// @desc	Login a user
// @route	POST /api/v1/auth/login
// @access	Public
exports.login = asyncHandler(async (req, res, next) => {

	const { email, password } = req.body;

	if (!email || !password) {
		return next (new ErrorResponse("Please provide email address and password", 400));
	}
	
	// Check for user
	const dbClass = require("../utils/dbPromises");
	let db = new dbClass(req.db);
	
	const sql = `SELECT * FROM "User" WHERE "email" = ?`;
	console.log(sql);
	
	const statement = await db.preparePromisified(sql);
	
	const results = await db.statementExecPromisified(statement, [email]);
	
	console.log(results);
	
	if (results.length !== 1) {
		return next (new ErrorResponse("Invalid credentials", 401));
	}
	
	// Check if password matches with hashed password in database
	console.log(results[0].password);
	const isMatch = await bcrypt.compare(password, results[0].password);
	
	if (!isMatch) {
		return next (new ErrorResponse("Invalid credentials", 401));
	}
	
	sendTokenResponse(results[0].id, results[0].firstName, results[0].lastName, results[0].email, 200, res);
	
	// const token = jwt.sign({firstName: results[0].firstName, lastName: results[0].lastName, email: results[0].email}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRE});
	
	// res.status(201).json({success: true, token});
			
});

// @desc	Register a user
// @route	POST /api/v1/auth/register
// @access	Public
exports.register = asyncHandler(async (req, res, next) => {

	const { firstName, lastName, email, password, address } = req.body;
	
	let location = await getPointCoordinates(address);
	console.log(JSON.stringify(location));
		
	let polygons = await getGeometryCoordinates(location.coordinates[0], location.coordinates[1]);
	
	// Encrypt password	
	const salt = await bcrypt.genSalt(10);
	const encryptedPassword = await bcrypt.hash(password, salt);

	const dbClass = require("../utils/dbPromises");
	let db = new dbClass(req.db);
	
	let sql = `INSERT INTO "User" ("firstName", "lastName", "email", "password", "formattedAddress", "isochrone5mCar", "coordinates") VALUES(?, ?, ?, ?, ?, ST_GEOMFROMGEOJSON('${polygons}', 4326), new ST_POINT(${location.coordinates[0]}, ${location.coordinates[1]}).ST_SRID(4326).ST_TRANSFORM( 4326))`;
	console.log(sql);
	
	let statement = await db.preparePromisified(sql);
	
	let results = await db.statementExecPromisified(statement, [firstName, lastName, email, encryptedPassword, location.formattedAddress]);
	
	sql = `SELECT CURRENT_IDENTITY_VALUE() "id" FROM "DUMMY"`;
	
	statement = await db.preparePromisified(sql);
	
	results = await db.statementExecPromisified(statement, []);
	
	console.log("Results: " + JSON.stringify(results));
	
	sendTokenResponse(results[0].id, firstName, lastName, email, 200, res);
	
	// Create JSON Web Token
	// const token = jwt.sign({firstName, lastName, email}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRE});
	
	// res.status(201).json({success: true, token});
			
});

// @desc	Get current logged in user
// @route	POST /api/v1/auth/me
// @access	Private
exports.getMe = asyncHandler(async (req, res, next) => {

	// Check for user
	const dbClass = require("../utils/dbPromises");
	let db = new dbClass(req.db);
	
	const sql = `SELECT * FROM "User" WHERE "email" = ?`;
	console.log(sql);
	
	const statement = await db.preparePromisified(sql);
	
	const results = await db.statementExecPromisified(statement, [req.user.email]);
	
	console.log(results);
	
	res.status(200).json({success: true, data: results[0]});
			
});


// @desc	Log out currently logged in user
// @route	POST /api/v1/auth/logout
// @access	Private
exports.logout = asyncHandler(async (req, res, next) => {

	const options = {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true
	}
	
	res.cookie('token', 'none', options);
	
	res.status(200).json({success: true, data: {}});
			
});


const getPointCoordinates = async (address) => {
	
	const loc = await geocoder.geocode(address);
	
	let location = {
		type: "Point",
		coordinates: [loc[0].longitude, loc[0].latitude],
		formattedAddress: loc[0].formattedAddress
	}

	return location;
};

const getGeometryCoordinates = async (longitude, latitude) => {
	
	const profiles = 'driving-car';
	const ranges = [300];
	
	const response = await Isochrones.calculate({
	    	locations: [[longitude, latitude]],
	    	profile: profiles,
	    	range: ranges
	});

	let geom = response["features"][0]["geometry"];
	
	let polygons = [];
	polygons.push(JSON.stringify(geom));
	
	
	return polygons;
};

// Create token, create cookie and send response
const sendTokenResponse = (id, firstName, lastName, email, statusCode, res) => {
	
	// Create JSON Web Token
	const token = jwt.sign({id, firstName, lastName, email}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRE});
	
	const options = {
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
		httpOnly: true
	}
	
	res
		.status(statusCode)
		.cookie('token', token, options)
		.json({
			success: true,
			token
		});
};