var https = require('https')

function getSpotifyLink(song, callback) {

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
			try {
				var songLink = ('https://play.spotify.com/track/' + JSON.parse(str).tracks.items[0].id)
				callback({ artist: song.artist, songName: song.songName, spotifyLink: songLink })
			}
			catch(err) {
				callback({ artist: song.artist, songName: song.songName, spotifyLink: '' })
			}
		})
	}).end()
}

exports.get = getSpotifyLink