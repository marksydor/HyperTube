const express	= require('express');
const router	= express.Router();
const yts		= require('../config/ytsAPI');
const mysql		= require('../config/database')
const movie		= require('../controllers/movie');
const auth		= require('../middleware/auth');
const striptags = require('striptags');
const passport  = require('passport');

router.get('/watched',  auth.redirect_login, (req, res) => movie.GetWatched(req, res));

router.post('/addComent', (req, res) => movie.PostAddComent(req, res));

router.get('/:id', auth.redirect_login, async (req, res) => movie.GetMovie(req, res));

module.exports = router;