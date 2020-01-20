const mysql = require('mysql');
const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
	port: 3306,
	insecureAuth : true
});

connection.connect();

connection.query('CREATE DATABASE IF NOT EXISTS HyperTube')
console.log('Database HyperTube created')
connection.query('USE HyperTube')
connection.query('CREATE TABLE IF NOT EXISTS users (id INT NOT NULL AUTO_INCREMENT Primary key, providerId VARCHAR(32),userName VARCHAR(50) NOT NULL, firstName VARCHAR(50), lastName VARCHAR(50), mail VARCHAR(50), newMail VARCHAR(50) DEFAULT "empty", password CHAR(129), online BOOL DEFAULT FALSE, confirmedMail BOOL DEFAULT FALSE, tempMail VARCHAR(129) DEFAULT "empty", gender VARCHAR(10) DEFAULT "anouther", provider VARCHAR(50), biography TEXT, avatar VARCHAR(128)  DEFAULT "/img/no_shinobu.jpg");');
console.log('Table users created')
connection.query('CREATE TABLE IF NOT EXISTS movies (id INT NOT NULL AUTO_INCREMENT Primary key, yts_id INT NOT NULL, path VARCHAR(256), sub_path VARCHAR(256), status BOOL DEFAULT 0);');
console.log('Table movies created')
connection.query('CREATE TABLE IF NOT EXISTS coments (id INT NOT NULL AUTO_INCREMENT Primary key, yts_id INT NOT NULL, user_id INT NOT NULL, coment TEXT);');
console.log('Table comments created')
connection.query('CREATE TABLE IF NOT EXISTS watched (id INT NOT NULL AUTO_INCREMENT Primary key, yts_id INT NOT NULL, user_id INT NOT NULL, img VARCHAR(128), title VARCHAR(128), rating INT, year INT);');
console.log('Table  watched created')
// connection.query('CREATE TABLE IF NOT EXISTS images (id_img INT NOT NULL AUTO_INCREMENT Primary key, path VARCHAR(50) NOT NULL, userName VARCHAR(50) NOT NULL);')
// console.log('Table users created')

connection.end();

1573650189899