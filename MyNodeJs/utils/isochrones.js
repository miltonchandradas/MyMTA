const openrouteservice = require("openrouteservice-js");

const Isochrones = new openrouteservice.Isochrones({
  api_key: process.env.OPENROUTESERVICE_API_KEY
});



module.exports = Isochrones;