const express	= require('express');
const router	= express.Router();
const mysql		= require('../config/database');
const session	= require('express-session');
const md5		= require('md5');
const uniqid	= require('uniqid');
const sendmail	= require('sendmail')();
const passport 	= require('passport');
const striptags	= require('striptags');
const bcrypt 	= require('bcrypt');

module.exports.GetProfile = (req, res) => {
	const id = parseInt(req.params.id);
	console.log(`req.params.id=${req.params.id}`)
	if (!id) {
		req.session.error = 'Wrong url';
		return res.redirect('/');
		req.session.error = '';
	}
	mysql.query("SELECT * FROM users WHERE id = ?", id, (err, row) => {
		if (err) { throw err; } else {
			if (row[0] && row[0]['id']) {
				let data = row[0];
				data['title'] = data['userName'];
				data['error'] = req.session.error;
				data['self_mode'] = true;
				data['change'] = data['provider'] == 'hypertube' ? true : false;
				req.session.error = '';
				return res.render('profile/profile', data)
			} else {
				req.session.error = 'Wrong url';
				return res.redirect('/')
				req.session.error = '';
			}
		}
	})	
}


module.exports.PutBio = (req, res) => {
	let body = {};
	if (req.body) {
		for (let key in req.body) {
			body[key] = striptags(req.body[key]);
		}
	} else
		return res.status(403).send('Error');
	const id = req.session.passport.user;
	// const id = 1;
	mysql.query('UPDATE users SET biography = ? WHERE id = ?', [body.bio, id], (err) => {
		if (err) { throw err } else {
			return res.status(200).send();
		}
	})
}

module.exports.PutPassword = (req, res) => {
	let body = {};
	if (req.body) {
		for (let key in req.body) {
			body[key] = striptags(req.body[key]);
		}
	} else
		return res.status(403).send('Error');
	const id = req.session.passport.user;
	// id = 1;
	mysql.query('SELECT * FROM users WHERE id = ?', id, (err, row) => {
		if (err) { throw err; } else {
			if (row[0] && row[0]['id'] && row[0]['provider'] == 'hypertube') {
				if (/[A-Z]/.test(body.password) == false || /[a-z]/.test(body.password) == false || /[0-9a-zA-Z]/.test(body.password) == false) {
					return res.status(400).send('password should include numbers and lowercase and uppercase letters');
				} else if (req.body.password != req.body.cpassword) {
					return res.status(400).send('password do not match');
				} else {
					let tempPass = 'AjdW1)ascusi' + body.password + 'c[dusiAjdW1' + row[0].userName;
					bcrypt.hash(tempPass, 10, (err, password) => {
						mysql.query('UPDATE users SET password = ? WHERE id = ?', [password , id], (err) => {
							if (err) { throw err } else {
								return	res.status(200).send();
							}
						});
					});
					
				}
			}
		}
	});
}

module.exports.PutNames = (req, res) => {
	let body = {}
	if (req.body) {
		for (let key in req.body) {
			body[key] = striptags(req.body[key].trim())
		}
	} else
		return res.status(403).send('Error')
	const id = req.session.passport.user;
	// const id = 1
	console.log(body);
	mysql.query('SELECT * FROM users WHERE id = ?', id, (err, row)=> {
		if (err) { throw err; } else {
			if (row[0] && row[0].id) {
				mysql.query('UPDATE users SET firstName = ?, lastName = ?, gender = ? WHERE id = ?', [body.firstName, body.lastName, body.gender, row[0].id], (err) => {
					if (err)
						throw err;
					else
						return res.status(200).send();	
				});
			} else {
				return res.status(404).send('user does not exist');
			}
		}
	});
}

