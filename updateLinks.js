'use strict'
const spotify = require('./getSpotifyInfo.js')
const mysql = require('mysql')
const _ = require('underscore')
const dotenv = require('dotenv')
dotenv.config()
const cfg = require('./config.js')

function update() {
	console.log('Running link updater... This might take several hours')
	const updateConnection = mysql.createConnection({
		host: cfg.dbHost,
		database: cfg.dbName,
		user: cfg.dbLogin,
		password: cfg.dbPassword
	})

	let songLinks = []
	let songsWithLink = []

	updateConnection.connect(err => {
		if(err) {
			console.log(err)
		}
		else {
			console.log('Connected')
		}
		updateConnection.query('select distinct Artist, SongName from links', (err, data) => {
			if(err) {
				console.log(err)
			}
			else {
				let requestArray = []
				let query = ''
				_.each(data, song => {
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