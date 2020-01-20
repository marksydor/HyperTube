const passport 			= require('passport');
const LocalStrategy 	= require('passport-local').Strategy;
const FacebookStrategy 	= require('passport-facebook').Strategy;
const FortyTwoStrategy 	= require('passport-42').Strategy;
const mysql				= require('../config/database');
const bcrypt 			= require('bcrypt');	

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	mysql.query("SELECT id FROM users WHERE id = ?", id, (err, row) => {
		if (err) { throw err; } else {
			const user = row[0]['id'] === id ? row[0]['id'] : false;
			done(null, user);
		}
	})
});

passport.use(
	new LocalStrategy({ usernameField: 'userName' }, function(
		userName,
		password,
		done
	) {
		if (!/^[a-zA-Z0-9_\s]*$/.test(userName) || !/^[a-zA-Z0-9_\s]*$/.test(password))
			return done(null, false);
		mysql.query("SELECT * FROM users WHERE userName = ? AND provider = 'hypertube'", userName, (err, row) => {
			if (err) {
				throw err;
			} else if (row[0] && row[0]['id']) {
				let tempPass = 'AjdW1)ascusi' + password + 'c[dusiAjdW1' + row[0].userName;
				bcrypt.compare(tempPass, row[0].password, (err, res) => {
					if (res) {
						return done(null, {id: row[0]['id']});
					} else {
						return done(null, false);
					} 
				});
			} else {
				return done(null, false);
			}
		});
	})
);

passport.use(new FacebookStrategy({
		clientID: '780142399101228',
		clientSecret: '856d6f2495d8f46d412da7491c89e11f',
		callbackURL: "http://localhost:3000/auth/facebook/callback"
	},
	(accessToken, refreshToken, profile, cb) => {
	mysql.query("SELECT id FROM users WHERE providerId = ? AND provider='facebook'", [profile.id], (err, row) => {
		if (err) {
			throw err;
		} else if (row[0] && row[0]['id']) {
			return cb(err, row[0]);
		} else {
			let data = {
				userName: profile.displayName,
				firstName: profile.givenName,
				lastName: profile.famileName,
				provider: 'facebook',
				providerId: profile.id
			}
			mysql.query("INSERT INTO users (userName, firstName, lastName, mail, provider, providerId) VALUES (?, ?, ?, ?, ?, ?)", [data.userName, data.firstName, data.lastName, data.mail, data.provider, data.providerId], (err) => {
				if (err) {
					throw err;
				} else {
					mysql.query("SELECT * FROM users WHERE userName = ?", data.userName, (err, row) => {
						if (err) { throw err } else {
							return cb(err, row[0]);
						}
					})
				}
			});
		}
	});
	}
));

passport.use(new FortyTwoStrategy({
		clientID: "e457bf91637ee3e166b207140d90d4df3b3c33dfa1b1618c37f878e0e3db4203",
		clientSecret: "19f55d050100882e36236512ac9a8544407c4d8c467495f9df15c07487d331c1",
		callbackURL: "http://localhost:3000/auth/42/callback"
	},
	function(accessToken, refreshToken, profile, cb) {
		mysql.query("SELECT id FROM users WHERE providerId = ? AND provider='42'", [profile._json.id], (err, row) => {
			if (err) {
				throw err;
			} else if (row[0] && row[0]['id']) {
				return cb(err, row[0]);
			} else {
				let data = {
					userName: profile._json.login,
					firstName: profile._json.first_name,
					lastName: profile._json.last_name,
					mail: profile._json.email,
					provider: '42',
					avatar: profile._json.image_url,
					providerId: profile._json.id
				}
				mysql.query("INSERT INTO users (userName, firstName, lastName, mail, provider, avatar, providerId) VALUES (?, ?, ?, ?, ?, ?, ?)", [ data.userName, data.firstName, data.lastName, data.mail, data.provider, data.avatar, data.providerId], (err) => {
					if (err) { throw err; } else {
						mysql.query("SELECT * FROM users WHERE userName = ?", data.userName, (err, row) => {
							if (err) { throw err } else {
								return cb(err, row[0]);
							}
						});
					}
				});
			}
		});
	}
));