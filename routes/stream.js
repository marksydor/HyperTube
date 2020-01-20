const express	= require('express');
const session	= require('express-session');
const router	= express.Router();
const mysql		= require('../config/database');
const yts		= require('../config/ytsAPI');
const fs		= require('fs');
const passport 	= require('passport');
const stream 	= require('../controllers/stream.js');

router.get('/:id', async (req, res) => stream.GetStream(req, res));

module.exports = router;