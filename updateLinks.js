var spotify = require('./getSpotifyInfo.js')
var mysql = require('mysql')
var _ = require('underscore')
var dotenv = require('dotenv')
dotenv.config()
var cfg = require('./config.js')

function update() {
	console.log('Running link updater... This might take several hours')
	var updateConnection = mysql.createConnection({
		host: cfg.dbHost,
		database: cfg.dbName,
		user: cfg.dbLogin,
		password: cfg.dbPassword
	})

	var songLinks = []
	var songsWithLink = []

	updateConnection.connect(function(err) {
		if(err) {
			console.log(err)
		}
		else {
			console.log('Connected')
		}
		updateConnection.query('select distinct Artist, SongName from links', function(err, data) {
			if(err) {
				console.log(err)
			}
			else {
				var requestArray = []
				var query = ''
				_.each(data, function(song) {
					requestArray.push({ artist: song.Artist.slice(1, -1), songName: song.SongName.slice(1, -1) })
				})
				spotify.get(requestArray, true, function(response) {
					console.log('Link update complete!')
				})
			}
		})
		updateConnection.end()
	})
}

exports.update = update