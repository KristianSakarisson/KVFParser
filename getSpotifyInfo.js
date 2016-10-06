var https = require('https')
var events = require('events')

function getSpotifyLink(artist, songName) {

	var searchString = encodeURIComponent(artist + ' ' + songName)

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
			try {
				var songLink = ('https://play.spotify.com/track/' + JSON.parse(str).tracks.items[0].id)
				songEmitter.emit('songReady', { artist: artist, songName: songName, spotifyLink: songLink } )
			}
			catch(err) {
				songEmitter.emit('songReady', { artist: artist, songName: songName, spotifyLink: '' })
			}
		})
	}).end()
}

var songEmitter = new events()

songEmitter.on('songRequest', function(song) {
	getSpotifyLink(song.artist, song.songName)
})

exports.linkFetch = songEmitter