dojo.ready(function() {
	var socket = io('http://localhost:12345')

	socket.emit('dataRequest')

	socket.on('dataResponse', function(data) {
		console.log(data)
		var html = '<table class="table"><tr><th>Artist</th><th>Song</th><th>Spældur</th><th>Seinast spældur</th></tr>'
		dojo.forEach(data, function(song) {
			lastPlayed = new Date(song.LastPlayed)
			html += '<tr><td>' + song.Artist.slice(1, -1) + '</td><td>' + song.SongName.slice(1, -1) + '</td><td>' + song.TimesPlayed + ' ferðir</td><td>' + lastPlayed.toLocaleDateString() + ' ' + ('0' + lastPlayed.getHours()).slice(-2) + ':' + ('0' + lastPlayed.getMinutes()).slice(-2) + '</td></tr>'
		})
		html += '</table>'
		$('#dataContainer').html(html)
	})
})