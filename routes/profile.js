const express		= require('express')
const router		= express.Router()
const passport 		= require('passport');
const fs			= require('fs');
const mysql			= require('../config/database');
const session		= require('express-session');
const md5			= require('md5');
const uniqid		= require('uniqid');
const sendmail		= require('sendmail')();
const auth			= require('../middleware/auth')
const mutler		= require('multer')
const mtlr_conf		= require('../config/mutler_config')
const striptags		= require('striptags')
const controllers 	= require('../controllers/profile.js')

const upload = mutler({
	storage: mtlr_conf.storageConfig,
	fileFilter: mtlr_conf.fileFilter
})

router.get('/edit', auth.redirect_login, (req, res) => controllers.GetEdit(req, res));

router.get("/mypage", auth.redirect_login, (req, res) => res.redirect('/profile/' + req.session.passport.user));

router.get('/:id', auth.redirect_login, (req, res) => controllers.GetProfile(req, res));

router.put("/edit_bio", async (req, res) => controllers.PutBio(req, res));

router.put('/edit_password', async (req, res) => controllers.PutPassword(req, res));

router.put('/names', async (req, res) => controllers.PutNames(req, res));

// router.post('/edit', async (req, res) => controllers.)





/*
**	================
**	WORK WITH IMAGES
**	================
*/

router.post("/add_photos", upload.array('photos'), function (req, res, next) {

	const delete_files = () => {
		req.files.map(file => {
			fs.unlink(file.path, err => {
				if (err) throw err
			})
			console.log(file.path)
		})	
	}
	if (!req.files[0]) 
		return res.redirect('/profile/' + req.session.passport.user)
	let path = '/uploads/' + req.files[0]['filename'];
	mysql.query("SELECT avatar FROM users WHERE id = ?", req.session.passport.user, (err, row) => {
		if (err) {
			throw err;
		} else {
			if (row[0]['avatar'] != "/img/no_shinobu.jpg" ) {
				fs.unlink('public' + row[0]['avatar'], err => {
					if (err) throw err
				})
			}
			mysql.query("UPDATE users SET avatar = ? WHERE id = ?", [path, req.session.passport.user], (err) => {
				if (err) {
					throw err;
				}
			})
		}
	})
	
	res.redirect('/profile/' + req.session.passport.user)
});




module.exports = router