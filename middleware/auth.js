const auth = {
	redirect_login: (req, res, next) => {
		if (!req.isAuthenticated())
			res.redirect('/auth/signin')
		else
			next()
	},
	redirect_home: (req, res, next) => {
		if (req.isAuthenticated()){
			res.redirect('/')
		}
		else
			next()
	}
}

module.exports = auth;