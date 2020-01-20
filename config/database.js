var mysql = require('mysql');
const util = require('util')

const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
	port: 3306,
	database: 'HyperTube',
	// insecureAuth : true
});


connection.connect()



connection.query = util.promisify(connection.query)

module.exports = connection;
