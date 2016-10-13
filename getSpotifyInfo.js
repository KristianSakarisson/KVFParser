var https = require('https')
var async = require('async')
var mysql = require('mysql')
var _ = require('underscore')
var dotenv = require('dotenv')
dotenv.config()
var cfg = require('./config.js')

var counter = 0

var databaseClient

function getSpotifyLinks(songArray, write, mainCallback) {

	if(toString.call(songArray) != '[object Array]') {
		songArray = [songArray]
	}

	var functionArray = []
	var resultArray = []

	if(write) {
		databaseClient = mysql.createConnection({
		    host: cfg.dbHost,
		    database: cfg.dbName,
		    user: cfg.dbLogin,
		    password: cfg.dbPassword
		})
	}

	functionArray.push(function(callback) {
		callback(null, null)
	})

	_.each(songArray, function(song) {
		functionArray.push(function(input, callback) {
			var searchString = encodeURIComponent(song.artist + ' ' + song.songName)

			var options = {
				host: 'api.spotify.com',
				path: '/v1/search?q=' + searchString + '&type=track'
			}

			https.request(options, function(response) {
				var str = ''

				response.on('data', function (chunk) {
					str += chunk;
				})

				response.on('end', function () {
					var songLink
					try {
						songLink = ('https://play.spotify.com/track/' + JSON.parse(str).tracks.items[0].id)
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
			functionArray.push(function(songObject, callback) {
				var query
				if (songObject.spotifyLink) { // Check that link is not undefined
					query = 'UPDATE links SET SpotifyURL = "' + songObject.spotifyLink + '" WHERE Artist = "\'' + songObject.artist + '\'" AND SongName = "\'' + songObject.songName + '\'"; '
					
					databaseClient.query(query, function(err, data) {
						if(err) {
							console.log(err)
						}
						//console.log(++counter + '(S): ' + songObject.artist + ' - ' + songObject.songName)
						callback(null, null)
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
