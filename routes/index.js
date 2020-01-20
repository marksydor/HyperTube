const express	= require('express');
const session	= require('express-session');
const router	= express.Router();
const mysql		= require('../config/database');
const yts		= require('../config/ytsAPI');
const movie		= require('../controllers/movie');
const auth		= require('../middleware/auth');
const passport  = require('passport');


router.get('/:param', auth.redirect_login, (req, res) => movie.GetIndexWithParams(req, res));

router.get('/', auth.redirect_login, async (req, res) => movie.GetIndex(req, res));

router.post('/loadMovies', async (req, res) => movie.PostLoadMovies(req, res));

module.exports = router;