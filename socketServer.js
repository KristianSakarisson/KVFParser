var io = require('socket.io')(12345)
var mysql = require('mysql')
var dotenv = require('dotenv')
dotenv.config()

var cfg = require('./config.js')

//Initialize connection variables
var con = mysql.createConnection({
    host: cfg.dbHost,
    database: cfg.dbName,
    user: cfg.dbLogin,
    password: cfg.dbPassword
})

//Connect to database
con.connect(function (err){
    if (err) {
        console.log('Error connecting to DB')
        console.log(err)
        return
    }
    console.log('Connection established')
})
function getMostPopularSongs(socket) {
	var mostPopularSongs = 'select Artist, ' +
	'SongName, ' + 
	'count(SongName) as TimesPlayed, ' +
	'max(Time) as LastPlayed ' +
	'from kvf ' +
	'where extract(year from Time) = 2016 ' +
	'group by SongName ' +
	'order by TimesPlayed desc ' +
	'limit 20'

	con.query(mostPopularSongs, function(err, data) {
		if(err) {
			console.log(err)
		}
		else {
			console.log('Sending response')
			socket.emit('dataResponse', data)
		}
	})
}

io.on('connection', function(socket) {
	console.log('Client connected')

	socket.on('dataRequest', function() {
		console.log('Data request received')
		getMostPopularSongs(socket)
	})
})