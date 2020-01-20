const express	= require('express');
const mysql		= require('../config/database');
const session	= require('express-session');
const md5		= require('md5');
const uniqid	= require('uniqid');
const sendmail	= require('sendmail')();
const passport 	= require('passport');
const bcrypt 	= require('bcrypt');

module.exports.PostCreateAccount = (req, res) => {
	if (!req.body.firstName || !req.body.lastName || !req.body.userName || !req.body.mail || !req.body.password) {
		req.session.error = "Fill in all the fields";
		return res.redirect('');
	} else if (!/^[a-zA-Z0-9_\s]*$/.test(req.body.firstName) || !/^[a-zA-Z0-9_\s]*$/.test(req.body.lastName) || !/^[a-zA-Z0-9_\s]*$/.test(req.body.userName) || !/^[a-zA-Z0-9@.]*$/.test(req.body.mail) || !/^[a-zA-Z0-9_\s]*$/.test(req.body.password)) {
		req.session.error = "please English";
		return res.redirect('/');
	} else if (req.body.firstName.length > 50 || req.body.userName.length > 50 || req.body.lastName.length > 50 || req.body.mail.length > 50 || req.body.password.length > 20) {
		req.session.error = "first name, last name, mail or password is too long";
		return res.redirect('/');
	} else if (req.body.firstName.length < 3 ||  req.body.lastName.length < 3 || req.body.mail.length < 6 || req.body.password.length < 6) {
		req.session.error = "first name, last name, mail or password is too short";
		return res.redirect('/');
	} else if (/[A-Z]/.test(req.body.password) == false || /[a-z]/.test(req.body.password) == false || /[0-9a-zA-Z]/.test(req.body.password) == false) {
		req.session.error = "password should include numbers and lowercase and uppercase letters";
		return res.redirect('/');
	} else if (/[a-zA-Z]/.test(req.body.firstName) == false || /[a-zA-Z]/.test(req.body.lastName) == false || /[0-9a-zA-Z]/.test(req.body.userName) == false) {
		req.session.error = "first name and last name should include only lowercase and uppercase letters";
		return res.redirect('/');
	} else if (req.body.password != req.body.cpassword) {
		req.session.error = "passwords do not match";
		return res.redirect('/');
	}
	mysql.query("SELECT * FROM users", (err, row) => {
		if (err) { throw err; } else {
			let found = row.find(element => (element.provider == "hypertube") && (element.mail == req.body.mail || element.userName == req.body.userName));
			if (found) {
				req.session.error = "user with this mail or user name already exist";
				return res.redirect('/');
			} else {
				let hash = md5(uniqid(req.body.mail) + 'hop-hey');
				let url = req.protocol + '://' + req.get('host') + '/auth/confirm?key=' + hash;
				sendmail({
					from: 'shadowstorm005@gmail.com',
					to: req.body.mail,
					subject: 'Confim your mail',
					html:  '<h1>Hellow please confirm your mail</h1><br><p>go this link to confirm</p><a href="'+ url +'">click here</a>',
				}, (err, rep) =>{
					if (err) {
						req.session.error = "something wrong with mail";
						return res.redirect('/');
					} else {
						let tempPass = 'AjdW1)ascusi' + req.body.password + 'c[dusiAjdW1' + req.body.userName;
						bcrypt.hash(tempPass, 10, (err, password) => {
							if (err) { throw err; } else {	
								mysql.query("INSERT INTO users (userName, firstName, lastName, mail, password, online, tempMail, provider) VALUES (?, ?, ?, ?, ?, ?, ?, 'hypertube')",
									[req.body.userName, req.body.firstName, req.body.lastName, req.body.mail, password, false, hash], (error) =>
								{
									if (error) { throw error; } else {	
										req.session.error = "check your mail";
										res.redirect('/');
									}
								});
							}
						});
					}
				});
			}
		}
	});
}

module.exports.PostSignInAccount = (req, res, next) => {
	passport.authenticate('local', (err, user) => {
		if (err) { 
			return next(err);
		}
		if (!user) {
			req.session.error = 'bad login or password';
			return res.redirect('/');
		}
		req.logIn(user, (err) => {
			if (err) {
				return next(err);
			}
			return res.redirect('/')
		});
	})(req, res, next);
}

module.exports.PostForget = (req, res) => {
	if (!/^[a-zA-Z0-9@.]*$/.test(req.body.mail) || !/^[a-zA-Z0-9@.]*$/.test(req.body.userName)) {
		req.session.error = 'English Please';
		return res.redirect('/forget');
	} else {
		mysql.query("SELECT * FROM users WHERE userName=? AND mail=? AND confirmedMail=1 AND provider='hypertube'", [req.body.userName, req.body.mail], (err, result) => {
			if (err) {
				throw err;
			} else if (result[0] && result[0]['id']) {
				var hash = md5(uniqid(req.body.mail) + 'hop-hey');
				var url = req.protocol + '://' + req.get('host') + '/auth/newpassword?key=' + hash;
				mysql.query('UPDATE users SET tempMail=? where id = ?', [hash, result[0]['id'] ], (err) => {
					if (err) { throw err;
					}
				});
				sendmail({
					from: 'shadowstorm005@gmail.com',
					to: req.body.mail,
					subject: 'Forgot password',
					html:  '<h1>Hellow please create new password</h1><br><p>go to this link to create new password</p><a href="'+ url +'">click here</a>',
				}, (err, rep) => {
					if (err) { throw err; } else {
						req.session.error = 'check your mail';
						return res.redirect('/');
					}
				});
			} else {
				req.session.error = 'can not find user with this mail or user name';
				return res.redirect('/forget');
			}
		});
	}
}

module.exports.PostNewPassword = (req, res) => {
	if (!/^[a-zA-Z0-9@.]*$/.test(req.body.password) || !/^[a-zA-Z0-9@.]*$/.test(req.body.cpassword)) {
		req.session.error = "Please English";
		res.redirect('/newpassword?key=' + req.session.newpassword);
	} else if (req.body.password.length < 6 || req.body.password.length > 20) {
		req.session.error = 'password is to shoort or too long (6< password <20)';
		res.redirect('/newpassword?key=' + req.query.key);
	} else if (/[A-Z]/.test(req.body.password) == false || /[a-z]/.test(req.body.password) == false || /[A-Za-z0-9]/.test(req.body.password) == false) {
		req.session.error = "password should include numbers and lowercase and uppercase letters";
		res.redirect('/newpassword?key=' + req.session.newpassword);
	} else if (req.body.password != req.body.cpassword) {
		req.session.error = 'password do not much';
		res.redirect('/newpassword?key=' + req.session.newpassword);
	} else {
		mysql.query('SELECT * FROM users WHERE tempMail=?', req.session.newpassword, (err, result) =>{
			if (err) { throw err; } else if (result[0] && result[0]['id']){
				let tempPass = 'AjdW1)ascusi' + req.body.password + 'c[dusiAjdW1' + result[0]['userName'];
				bcrypt.hash(tempPass, 10, (err, password) => {
					if (err) { throw err; } else {	
						console.log('password');
						mysql.query('UPDATE users SET password=?, tempMail="empty" WHERE id=?', [password, result[0]['id']], (err) => {
							if (err) {
								throw err;
							} else {
								req.session.newpassword = 0;
								req.logIn({id: result[0]['id']}, (err) => {
   									if (err) 
   		  								return next(err);
   									return res.redirect('/');
   								});
							}
						});
					}
				});			
			} else {
				req.session.error = "old link";
				res.redirect('/');
			}
		});
	}
}

module.exports.GetConfirmMail = (req, res) => {
	if (!req.query.key) {
		req.session.error = 'bad key';
		return res.redirect('');
	}
	mysql.query('SELECT * FROM users', (err, row) => {
		if (err) { throw err; } else {
			let found = row.find(element => (element.provider == "hypertube") && (element.tempMail == req.query.key) && (element.confirmedMail == '0'));
			if (found) {
				mysql.query('UPDATE users SET confirmedMail=1, tempMail="empty", online=1 WHERE tempMail=?', req.query.key, (err) => {
					if (err) { throw err; }
				});
				req.logIn({id: found.id}, (err) => {
					if (err) 
						throw err;
					return res.redirect('/');
				})
			} else {
				req.session.error = 'bad key';
				return res.redirect('/');
			}
		}
	});
}

module.exports.GetSignInAccount = (req, res) => {
	let data = {
		error: req.session.error,
		title: "signin"
	}
	req.session.error = '';
	return res.render('auth/signin', data);
}

module.exports.GetCreateAccount = (req, res) => {
	let data = {
		error: req.session.error, 
		title: 'Create Account'
	}
	req.session.error = '';
	return res.render('auth/signup', data );
}

module.exports.GetForget = (req, res) => {
	let data = {
		title: 'Forget',
		error: req.session.error
	}
	req.session.error = '';
	return res.render('auth/forget', data);
}

module.exports.GetNewPassword = (req, res) => {
	if (!req.query.key) {
		req.session.error = 'bad key or old link';
		res.redirect('/');
	} else {
		let data = {
			error: req.session.error,
			title: 'Create new password' 
		}
		req.session.error = '';
		req.session.newpassword = req.query.key;
		return res.render('auth/newpassword', data);
	}
}

module.exports.GetLogOut = (req, res) => {
	req.logout();
	return res.redirect('/');
}

