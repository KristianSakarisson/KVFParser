var https = require('https')

callback = function(response) {
	var str = ''

	response.on('data', function (chunk) {
		str += chunk;
	})

	response.on('end', function () {
		try {
			console.log('https://play.spotify.com/track/' + JSON.parse(str).tracks.items[0].id)
		}
		catch(err) {
			console.log('Song not found on Spotify')
		}
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

exports.getLink = getSpotifyLink