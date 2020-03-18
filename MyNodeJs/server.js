/*eslint no-console: 0*/
"use strict";

const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/error");
const xsHDBConn = require("@sap/hdbext");
const xsenv = require("@sap/xsenv");


let hanaOptions = xsenv.getServices({
		hana: {
			tag: "hana"
		}
	});

const auth = require("./routes/auth");
const products = require("./routes/products");

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Logging
app.use(morgan("dev"));

app.use(xsHDBConn.middleware(hanaOptions.hana));

app.use("/api/v1/products", products);
app.use("/api/v1/auth", auth);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV || "dev";

app.listen(PORT, console.log(`Server running in ${nodeEnv} mode on port ${PORT}`));
