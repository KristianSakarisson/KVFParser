var https = require('https')
var events = require('events')

callback = function(response) {
	var str = ''

	response.on('data', function (chunk) {
		str += chunk;
	})

	response.on('end', function () {
		try {
			var songLink = ('https://play.spotify.com/track/' + JSON.parse(str).tracks.items[0].id)
			songEmitter.emit('songReady', songLink)
		}
		catch(err) {
			console.log('Song not found on Spotify')
			songEmitter.emit('songReady', '')
		}
		//songEmitter.emit('songReady')
	})
}

function getSpotifyLink(artist, songName) {

	var searchString = encodeURIComponent(artist + ' ' + songName)

	var options = {
		host: 'api.spotify.com',
		path: '/v1/search?q=' + searchString + '&type=track'
	}

	https.request(options, callback).end()
}

var songEmitter = new events()

songEmitter.on('songRequest', function(song) {
	getSpotifyLink(song.artist, song.songName)
})

songEmitter.on('songReady', function(link) {
	//songEmitter.emit(link)
	console.log(link)
})

songEmitter.emit('songRequest', { artist: 'Týr', songName: 'Ormurin Langi'})

exports.link = songEmitter