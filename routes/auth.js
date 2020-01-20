const express		= require('express');
const router		= express.Router();
const mysql			= require('../config/database');
const session		= require('express-session');
const md5			= require('md5');
const uniqid		= require('uniqid');
const sendmail		= require('sendmail')();
const auth			= require('../middleware/auth')
const controllers  	= require('../controllers/auth.js');
const passport 		= require('passport');

/*
---> GET
*/
router.get('/signup', auth.redirect_home, (req, res) => controllers.GetCreateAccount(req, res));

router.get('/signin', auth.redirect_home, (req, res) => controllers.GetSignInAccount(req, res));

router.get('/facebook', passport.authenticate('facebook'));

router.get('/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));

router.get('/42', passport.authenticate('42'));

router.get('/42/callback', passport.authenticate('42', { failureRedirect: '/login' }), (req, res) => res.redirect(''));

router.get('/confirm',  auth.redirect_home, (req, res) => controllers.GetConfirmMail(req, res));

router.get('/newpassword', auth.redirect_home, (req, res) => controllers.GetNewPassword(req, res));

router.get('/forget', auth.redirect_home, (req, res) => controllers.GetForget(req, res));

router.get('/logout', (req, res) => controllers.GetLogOut(req, res));
/*
---> POST
*/
router.post('/signin', (req, res, next) => controllers.PostSignInAccount(req, res, next));

router.post('/signup', (req, res) => controllers.PostCreateAccount(req, res));

router.post('/newpassword', (req, res) => controllers.PostNewPassword(req, res));

router.post('/forget', (req, res) => controllers.PostForget(req, res));

module.exports = router;
