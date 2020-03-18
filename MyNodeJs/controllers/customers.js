const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const geocoder = require("../utils/geocoder");
const Isochrones = require("../utils/isochrones");


// @desc	Get a customer
// @route	GET /api/v1/customers/:id
// @access	Public
exports.getCustomer = asyncHandler(async (req, res, next) => {
	
	const dbClass = require("../utils/dbPromises");
	let db = new dbClass(req.db);
	
	const sql = `SELECT * FROM "Customer" WHERE "id" = ?`;
	console.log(sql);
	
	const statement = await db.preparePromisified(sql);
	
	const results = await db.statementExecPromisified(statement, [req.params.id]);
	
	res.status(200).json({success: true, data: results});
			
});


// @desc	Get all customers
// @route	GET /api/v1/customers
// @access	Public
exports.getCustomers = asyncHandler(async (req, res, next) => {

	const dbClass = require("../utils/dbPromises");
	let db = new dbClass(req.db);
	
	const sql = `SELECT * FROM "Customer"`;
	console.log(sql);
	
	const statement = await db.preparePromisified(sql);
	
	const results = await db.statementExecPromisified(statement, []);
	
	res.status(200).json({success: true, data: results});
			
});



// @desc	Add customer
// @route	POST /api/v1/customers
// @access	Public
exports.addCustomer = asyncHandler(async (req, res, next) => {
	
	const { firstName, lastName, email, address } = req.body;
	const profiles = 'driving-car';
	const ranges = [300];
	
	const response = await Isochrones.calculate({
	    	locations: [[8.690958, 49.404662], [8.687868, 49.390139]],
	    	profile: profiles,
	    	range: ranges
	});

	let geom = response["features"][0]["geometry"];
	
	let polygons = [];
	polygons.push(JSON.stringify(geom));
	
	console.log(polygons);
	
	const loc = await geocoder.geocode(address);
	let location = {
		type: "Point",
		coordinates: [loc[0].longitude, loc[0].latitude],
		formattedAddress: loc[0].formattedAddress
	}
	
	console.log(JSON.stringify(location));

	const dbClass = require("../utils/dbPromises");
	let db = new dbClass(req.db);
	
	const sql = `INSERT INTO "Customer" ("firstName", "lastName", "email", "longitude", "latitude", "formattedAddress", "isochrone5mCar", "coordinates") VALUES(?, ?, ?, ?, ?, ?, ST_GEOMFROMGEOJSON('${polygons}', 4326), new ST_POINT(${location.coordinates[0]}, ${location.coordinates[1]}).ST_SRID(4326).ST_TRANSFORM( 4326))`;
	console.log(sql);
	
	const statement = await db.preparePromisified(sql);
	
	const results = await db.statementExecPromisified(statement, [firstName, lastName, email, location.coordinates[0], location.coordinates[1], location.formattedAddress]);
	
	res.status(201).json({success: true, message: "Successfully added customer to database..."});
	
});

// @desc	Delete customer
// @route	DELETE /api/v1/customers/:id
// @access	Public
exports.deleteCustomer = asyncHandler(async (req, res, next) => {

	const dbClass = require("../utils/dbPromises");
	let db = new dbClass(req.db);
	
	const sql = `DELETE FROM "Customer" WHERE "id" = ?`;
	console.log(sql);
	
	const statement = await db.preparePromisified(sql);
	
	const results = await db.statementExecPromisified(statement, [req.params.id]);
	
	res.status(200).json({success: true, data: {}});
	
});


// @desc	Update customer
// @route	PUT /api/v1/customers/:id
// @access	Public
exports.updateCustomer = asyncHandler(async (req, res, next) => {
	
	console.log(req.body);
	
	const dbClass = require("../utils/dbPromises");
	let db = new dbClass(req.db);
	
	const sql1 = `SELECT * FROM "Customer" WHERE "id" = ?`;
	console.log(sql1);
	
	const statement1 = await db.preparePromisified(sql1);
	const result1 = await db.statementExecPromisified(statement1, [req.params.id]);
	
	if (result1.length !== 1) {
		return next(
			new ErrorResponse(`Customer not found`, 404)
		);
		// return res.status(400).json({success: false});
	}
	
	const sql2 = `UPDATE "Customer" SET "address" = ? WHERE "id" = ?`;
	console.log(sql2);	
	
	const statement2 = await db.preparePromisified(sql2);
	
	const result2 = await db.statementExecPromisified(statement2, [req.body.address, req.params.id]);
	
	return res.status(200).json({success: true});
			
});



// OLD WAY OF DOING STUFF...

/*
// @desc	Get all customers
// @route	GET /api/v1/customers
// @access	Public
exports.getCustomers = (req, res, next) => {
	
	let client = require("@sap/hana-client");
	const xsenv = require("@sap/xsenv");
	
	let hanaOptions = xsenv.getServices({
		hana: {
			tag: "hana"
		}
	});
	
	let conn = client.createConnection();
	let connParams = {
		host: hanaOptions.hana.host,
		port: hanaOptions.hana.port,
		uid: hanaOptions.hana.user,
		pwd: hanaOptions.hana.password,
		CURRENTSCHEMA: hanaOptions.hana.schema,
		sslValidateCertificate: false,
		encrypt: true
 	};
 	
 	console.log(JSON.stringify(connParams));
 	
 	conn.connect(connParams, (err) => {
 		
 		console.log("Step 1");
		if (err) {
			console.error(err);
			throw err;
		}
  
		conn.exec('SELECT "firstName" FROM "Customer"', (err, result) => {
    		
    		console.log("Step 2");
    		if (err) {
				console.error(err);
				throw err;
			}
			
			console.log("Step 3");
    		console.log('Name: ', result[0].firstName);
    		
    		res.json(result);
    
    		conn.disconnect();
    		console.log("Step 4");
    		
    		
		});
	});
 
};


exports.getCustomersHDB = (req, res, next) => {

	let client = req.db;

	client.prepare(
		`SELECT "firstName" from "Customer"`,
		(err, statement) => {
			if (err) {
				console.log(err);
				return res.type("text/plain").status(500).send("ERROR: " + err.toString());
			}
			
			statement.exec(
				[],
				(err, results) => {
					if (err) {
						return res.type("text/plain").status(500).send("ERROR: " + err.toString());
					} 
					
					res.json(results);
				});
			
			return null;
		});
};


*/