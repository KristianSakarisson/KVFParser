'use strict'
const io = require('socket.io')(12345)
const mysql = require('mysql')
const dotenv = require('dotenv')
dotenv.config()

const cfg = require('./config.js')

//Initialize connection variables
const con = mysql.createConnection({
    host: cfg.dbHost,
    database: cfg.dbName,
    user: cfg.appLogin,
    password: cfg.appPassword
})

//Connect to database
con.connect(err => {
    if (err) {
        console.log('Error connecting to DB')
        console.log(err)
        return
    }
    //console.log('Connection established')
})

function generateQuery(socket, artist, song) {
	const query = `
	select Artist, 
	SongName, 
	Time 
	from kvf 
	where Artist like (concat("%", trim(both "'" from "${mysql.escape(artist)}"), "%")) 
	and SongName like (concat("%", trim(both "'" from "${mysql.escape(song)}"), "%")) 
	order by id desc 
	limit 100;`

	console.log(query)

	con.query(query, (err, data) => {
		if(err) {
			console.log(err)
			return
		}
		else {
			//console.log(data)
			socket.emit('searchResponse', {data: data})
		}
	})
}

function getMostPopularSongs(socket, start) {
	if(start < 0) {
		start = 0
	}
	const responseObject = {
		data : null,
		startCount: start
	}

	const mostPopularSongs = `
	select Artist, 
	SongName, 
	count(SongName) as TimesPlayed, 
	max(Time) as LastPlayed 
	from kvf 
	where extract(year from Time) = 2017 
	group by SongName 
	order by TimesPlayed desc 
	limit ${start}, 20;`

	con.query(mostPopularSongs, (err, data) => {
		if(err) {
			console.log(err)
		}
		else {
			responseObject.data = data
			//console.log('Query took ' + (Date.now() - start) + ' ms')
			//console.log('Sending response')
			socket.emit('dataResponse', responseObject)
		}
	})
}

io.on('connection', socket => {
	//console.log('Client connected')
	let lastRequest = null
	socket.on('dataRequest', startCount => {
		if(lastRequest == null || Date.now() - lastRequest > 500) {
			//console.log('Data request received')
			//console.log('Last request ' + (Date.now() - lastRequest) + ' milliseconds ago')
			getMostPopularSongs(socket, startCount)
			lastRequest = Date.now()
		}
		else {
			//console.log('Request too recent! ' + (Date.now() - lastRequest) + ' milliseconds ago')
		}
	})

	socket.on('search', (artist, song) => {
		generateQuery(socket, artist, song)
	})
})