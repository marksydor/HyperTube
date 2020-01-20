const fetch 		= require('node-fetch');
const yts 			= require('../config/ytsAPI');
const options		= require('../config/torrent');
const express		= require('express');
const mysql			= require('../config/database')
const passport  	= require('passport');
const session	= require('express-session');


const MagnetLink = (hash, title) => {
	return ('magnet:?xt=urn:btih:' + hash + '&dn=' + encodeURIComponent(title) + 'tr=' + options.trackers.join('&tr='));
}

const getMoviesByParams = async (params) => {
	if (params.genre) {
		var p = '?genre=';
		p += params.genre.length > 1 ? params.genre : params.genre.join('&genre=');
	} else {
		var p = '?'
	}
	if (params.sort) {
		p += p == '?' ? 'sort_by=' : '&sort_by=';
		p += params.sort
	}
	p += p == '?' ? 'order_by=' : '&order_by=';
	p += params.status;
	if (params.title) {
		p += '&query_term=';
		p += params.title;
	}
	p += '&limit=50&page=' + params.page;
	const url = yts.MovieList + p;
	let result = [];
	await fetch(url)
		.then(res => res.json())
		.then((json) => {
			const movies = json.data.movies;
			if (movies) {
				for (var i = 0; i < movies.length; i++) {
					result.push({
						id: movies[i].id,
						img: movies[i].medium_cover_image,
						year: movies[i].year,
						name: movies[i].title_english,
						rating: movies[i].rating
					})
				}
			}
		});
	return(result)
};

const getDetailById = async (id) => {
	let url = yts.MovieDetails + id;
	let result = [];
	await fetch(url)
		.then(res => res.json())
		.then((json) => {
			result = json.data.movie; 
			result['MagnetLink'] = MagnetLink(json.data.movie.torrents[0].hash, json.data.movie.title_long)
		});
	return (result);
}

const getSuggestionById = async (id) => {
	url = yts.MovieSuggestion + id;
	let sugMv = [];	
	await fetch(url)
		.then(res => res.json())
		.then((json) => {
			let temp = json.data.movies;
			for (var i = 0; i < temp.length; i++) {
				sugMv.push({
					id: temp[i].id,
					img: temp[i].medium_cover_image,
					year: temp[i].year,
					name: temp[i].title_english,
					rating: temp[i].rating
				})
			}
		});
	return (sugMv);
}

const GetIndex = async (req, res) => {
	let result = await getMoviesByParams({
		page: 1,
		title: false,
		genre: false,
		status: false,
		sort: false
	});
	let data = {
		error: req.session.error,
		user: req.session.user,
		title: 'HyperTube',
		movies: result,
		search: '',
		genre: ''
	};
	return res.render('index', data)
	req.session.error = ''
}

const GetIndexWithParams = async (req, res) => {
	if (parseInt(req.params.param) > 1900) {
		var title = parseInt(req.params.param);
		var genre = false;
	}
	else {
		var title = false;
		var genre = req.params.param;
	}
	let result = await getMoviesByParams({
		page: 1,
		title: title,
		genre: genre,
		status: false,
		sort: false
	});
	let data = {
		error: req.session.error,
		user: req.session.user,
		title: 'HyperTube',
		movies: result,
		search: title,
		genre: genre
	};
	return res.render('index', data)
	req.session.error = ''
}

const PostLoadMovies = async (req, res) => {
	let result = await getMoviesByParams({
		genre: req.body.genre,
		sort: req.body.sort,
		status: req.body.status,
		title: req.body.title,
		page: req.body.page
	});
	return res.json(result);
}

const GetWatched = (req, res) => {
	mysql.query("SELECT * FROM watched WHERE user_id = ? ORDER BY id", req.session.passport.user, (err, row) => {
		if (err) { throw err; } else {
			let data = {
				title: 'HyperTube',
				movies: row
			}
			return res.render('watched', data);
		}
	});
}

const PostAddComent = (req, res) => {
	let user = req.session.passport.user;
	// let user = 1
	if (req.body.coment) {
		let coment = striptags(req.body.coment);
		mysql.query("SELECT avatar, userName, id FROM users WHERE id = ?", user, (err, row) => {
			if (err) { throw err; } else {
				if (row[0] && row[0]['id']) {
					mysql.query("INSERT INTO coments (yts_id, user_id, coment) VALUES (?, ?, ?)", [req.body.yts_id, row[0]['id'], coment], (err) => {
						if (err) { throw err; } else {
							return res.status(200).send(JSON.stringify({avatar: row[0]['avatar'], id: row[0]['id'], userName: row[0]['userName'], coment: coment}))
						}
					})
				}
			}
		})
	}
}

const GetMovie = async (req, res) => {
	let result = await getDetailById(req.params.id);
	const id = req.session.passport.user
	result['sug'] = await getSuggestionById(req.params.id);
	
	mysql.query('SELECT * FROM coments LEFT JOIN users ON coments.user_id = users.id WHERE coments.yts_id = ?', req.params.id, (err, row) => {
		if (err) { throw err; } else {
			if (!Array.isArray(row))
				result['coments'] = [row]
			else
				result['coments'] = row
			mysql.query('SELECT * FROM watched WHERE yts_id = ? AND user_id = ?', [result.id, req.session.passport.user], (err, row) => {
				if (err) { throw err; } else {
					if (!row[0])
						mysql.query('INSERT INTO watched (yts_id, user_id, img, title, rating, year) VALUES (?, ?, ?, ?, ?, ?)', [result.id, req.session.passport.user, result.medium_cover_image, result.title_english, result.rating, result.year], (err) => {
							if (err) throw err;
						});
					mysql.query('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
						if (err) { throw err; } else {
							result['user'] = row[0];
							let data = {
								error: req.session.error,
								user: req.session.user,
								title: 'HyperTube',
								details: result								
							}
							return res.render('movie', data);
							req.session.error = ''
						}
					});			
				}
			});
		}
	});
}
module.exports = {
	getDetailById: getDetailById,
	GetMovie: GetMovie,
	GetIndexWithParams: GetIndexWithParams,
	GetIndex: GetIndex,
	PostLoadMovies: PostLoadMovies,
	GetWatched: GetWatched,
	PostAddComent: PostAddComent,
	GetMovie: GetMovie
}