const fs			= require('fs');
const pump			= require('pump');
const mysql			= require('../config/database');
const torrentStream	= require('torrent-stream');
const options		= require('../config/torrent');
const movie  		= require('./movie.js');

const GetMovieFromLocal = (data, req, res) => {
	console.log('start local stream' + data.path)
	const stat = fs.statSync(data.path);
	const fileSize = stat.size;
	const range = req.headers.range;
	const mime = data.path.substr(-3);
	let total = fileSize;
	if (range) {
		console.log('->range allowed')
		const parts = range.replace(/bytes=/, "").split("-")
		var partialstart = parts[0];
		var partialend = parts[1];
		var start = parseInt(partialstart);
		if (partialend)
			var end = parseInt(partialend);
		else
			var end = fileSize-1;

		const chunksize = (end-start)+1;
		res.writeHead(206, {
			'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
			'Accept-Ranges': 'bytes',
			'Content-Length': chunksize,
			"Content-Type": "video/" + mime,
			Connection: 'keep-alive'
		});
		var stream = fs.createReadStream(data.path, {
			start: start,
			end: end
		})
		pump(stream, res);
		console.log('->start local stream');
	} else {
		console.log('->error: range not allowed');
	}
}

const GetMovieFromMagnet = (data, req, res) => {
	const engine = torrentStream(data.MagnetLink, options);
	let movie;
	var percent = 0;
	var temp = percent;
	var sub = undefined;
	engine.on('ready', () =>{
		engine.files.forEach((file) => {
			if (file.path.substr(-4) == '.mp4' || file.path.substr(-4) == '.ogg' || file.path.substr(-4) == '.mkv' || file.path.substr(-4) == '.avi') {
				// var [rows, fields] =  await con.execute('INSERT INTO movies (yts_id, path, status) VALUES (?, ?, ?)', [data.id, file.path, 0]);
				movie = {
					title: file.name,
					format: file.path.substr(-3),
					FileSize: file.length,
				}
				file.select();
				console.log('->start download and torrent stream' + file.path);
				if (req.headers.range) {
					var range = req.headers.range;
					var total = file.length;
					var parts = range.replace(/bytes=/, "").split("-");
					var partialstart = parts[0];
					var partialend = parts[1];
					const partSize = 100000000; 
					start = parseInt(partialstart);
					if (!partialend) {
						if (start + partSize >= total)
							end = total - 1;
						else 
							end = start + partSize;
					} else {
						end = parseint(partialend);
					}
					// var start = parseInt(partialstart, 10);
					// var end = partialend ? parseInt(partialend, 10) : total;
					var chunksize = (end-start) + 1;
					// const chunkSize = end - start + 1;
					const path = '/tmp/' + file.path;
					res.writeHead(206,  	{
						"Content-Range": "bytes " + start + "-" + end + "/" + total,
						"Accept-Ranges": "bytes",
						"Content-Length": chunksize,
						"Content-Type": "video/" + file.path.substr(-3),
						Connection: 'keep-alive'
					});
					let stream = file.createReadStream({
						start: start,
						end: end,
					});
					pump(stream, res);
				}
				engine.on('idle', () => {
					console.log(file.path + '->successfully downloaded');
					mysql.query('UPDATE movies SET status = ?, path = ? WHERE yts_id = ?', [1, './tmp/' + file.path, data.id], (err) => {
						if (err) {
							throw err;
						} else {
							console.log(movie.title + '->successfully database updated');			
						}
					})
				})
				engine.on('idle', () => {
					console.log('->all files downloaded');
				})
			} else {
				return (file.deselect());
			}
		})
	})
};

module.exports.GetStream = async (req, res) => {
	let result = await movie.getDetailById(req.params.id);
	mysql.query("SELECT * FROM movies WHERE yts_id = ?", [result.id], (err, row) => {
		if (err) { throw err; } else {
			// if (row[0] && row[0]['sub_path'])
			// 	stream.GetSubtitles({id: result.id});
			if (row[0] && row[0]['id'] && row[0]['status'] == 1) {
				console.log('movie is uploaded')
				GetMovieFromLocal({path: row[0]['path']}, req, res);
			} else if (row[0] && row[0]['id'] && row[0]['status'] == 0) {
				console.log('movie is not uploaded')
				return GetMovieFromMagnet({id: result.id, MagnetLink: result.MagnetLink}, req, res);
			} else { 
				console.log('movie is not uploaded')
				mysql.query("INSERT INTO movies (yts_id, status) VALUES (?, ?)", [result.id, 0], (err) => {
					if (err) { throw err; } else {
						return GetMovieFromMagnet({id: result.id, MagnetLink: result.MagnetLink}, req, res);
					}
				})
			}
		}
	})
	req.session.error = ''
};


