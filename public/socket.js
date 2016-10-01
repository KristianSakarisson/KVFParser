dojo.ready(function() {
	var socket = io('http://' + config.externalServer)
	var index = 0

	function makeRequest() {
		socket.emit('dataRequest', index)
	}

	socket.on('dataResponse', function(responseObject) {
		console.log(responseObject)
		var data = responseObject.data
		var counter = responseObject.startCount + 1
		var html = '<table class="table table-striped table-bordered" cellspacing="0" width="100%"><tr><th>Bólkur</th><th>Heiti</th><th>Spældur</th><th>Seinast spældur</th></tr>'
		$('#title').html('Mest spældu sangirnir á KVF í ' + new Date(data[0].LastPlayed).getFullYear())
		dojo.forEach(data, function(song) {
			lastPlayed = new Date(song.LastPlayed)
			html += '<tr><td>' + counter++ + '. ' + song.Artist.slice(1, -1) + '</td><td>' + 
			song.SongName.slice(1, -1) + '</td><td>' + 
			song.TimesPlayed + ' ferðir</td><td>' + 
			lastPlayed.toLocaleDateString() + ' ' + ('0' + lastPlayed.getHours()).slice(-2) + ':' + ('0' + lastPlayed.getMinutes()).slice(-2) + '</td></tr>'
		})
		html += '</table>'
		$('#dataContainer').html(html)
	})

	makeRequest()

	$("#backButton").click(function() {
		console.log('back')
		if(index - 20 >= 0) {
			index -= 20
			makeRequest()
		}
	})
	$("#forwardButton").click(function() {
		console.log('forward')
		index += 20
		makeRequest()
	})
})