var pgp = require('pg-promise')();
const connectionString = 'postgres://localhost:5432/setlistify_development';
var db = pgp(connectionString);
module.exports = db;
