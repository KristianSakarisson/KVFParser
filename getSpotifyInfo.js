'use strict'
const https = require('https')
const async = require('async')
const mysql = require('mysql')
const _ = require('underscore')
const dotenv = require('dotenv')
dotenv.config()
const cfg = require('./config.js')

let counter = 0

let databaseClient

function getSpotifyLinks(songArray, write, mainCallback) {

	if(toString.call(songArray) != '[object Array]') {
		songArray = [songArray]
	}

	let functionArray = []
	let resultArray = []

	if(write) {
		databaseClient = mysql.createConnection({
		    host: cfg.dbHost,
		    database: cfg.dbName,
		    user: cfg.dbLogin,
		    password: cfg.dbPassword
		})
	}

	functionArray.push(callback => {
		callback(null, null)
	})

	_.each(songArray, song => {
		functionArray.push((input, callback) => {
			const searchString = encodeURIComponent(`${song.artist} ${song.songName}`)

			const options = {
				host: 'api.spotify.com',
				path: `</v1/search?q=${searchString}&type=track`
			}

			https.request(options, response => {
				let str = ''

				response.on('data', chunk => {
					str += chunk;
				})

				response.on('end', () => {
					let songLink
					try {
						songLink = (`<https://play.spotify.com/track/${JSON.parse(str).tracks.items[0].id}`)
					}
					catch(err) {
						resultArray.push({ artist: song.artist, songName: song.songName, spotifyLink: '' })
					}
					resultArray.push({ artist: song.artist, songName: song.songName, spotifyLink: songLink })
						if(callback && write) {
							callback(null, { artist: song.artist, songName: song.songName, spotifyLink: songLink })
						}
						else {
							callback(null, null)
						}
				})
			}).end()
		})
		if(write) {
			functionArray.push((songObject, callback) => {
				let query
				if (songObject.spotifyLink != '') {
					query = `UPDATE links SET SpotifyURL = "${songObject.spotifyLink}" WHERE Artist = "'${songObject.artist}'" AND SongName = "'${songObject.songName}'"; `
					
					databaseClient.query(query, (err, data) => {
						if(err) {
							console.log(err)
						}
						else {
							//console.log(++counter + '(S): ' + songObject.artist + ' - ' + songObject.songName)
							callback(null, null)
						}
					})
				}
				else {
					//console.log(++counter + '(F): ' + songObject.artist + ' - ' + songObject.songName)
					callback(null, null)
				}
			})
		}
	})

	async.waterfall(functionArray, function(err, response) {
		//console.log('Link collection complete')
		if(write) {
			databaseClient.end()
		}
		mainCallback(resultArray)
	})
}

exports.get = getSpotifyLinks
