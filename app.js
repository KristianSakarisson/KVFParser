//Import required modules
var xml2js = require('xml2js') //Used for converting between XML and JSON
var http = require('http') //Used for connecting to XML sheet
var mysql = require('mysql')//Used for connecting to database and executing queries
var dotenv = require('dotenv')
var _ = require('underscore.string') //Used to check if strings contain "illegal" entries
var express = require('express')
dotenv.config()

var cfg = require('./config.js')
var server = require('./socketServer.js')

var app = express()

app.get('/', function(req, res) {
	res.send('Hello world!')
})

app.listen(80, function() {
	console.log('App is listening on port 80')
})

var currentSong
var lastModified
var lastSong

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

//Find last song played on startup
con.query(
    'SELECT * FROM ' + cfg.tableName + ' ORDER BY ID DESC LIMIT 1', function (e, rows){
        if (e)
            console.log('Error: ' + e.message)
        else {
        	if(rows.length > 0)
            	lastSong = JSON.stringify(rows[0].Artist).slice(2, -2) + JSON.stringify(rows[0].SongName).slice(2, -2)
            else
            	lastSong = ""
        }
    }
)

//=================================================
//Run the actual query.
//This function will insert the current song into
//the database
//=================================================
function runQuery() {
    console.log(new Date())
    if (currentSong.data.now[0].artist != '' && 
        currentSong.data.now[0].title != '' && 
        !_.contains(currentSong.data.now[0].title, 'Høvuðstíðindi') && 
        !_.contains(currentSong.data.now[0].title, 'GMF')) {
        if (JSON.stringify(currentSong.data.now[0].artist).slice(2, -2) + JSON.stringify(currentSong.data.now[0].title).slice(2, -2) != lastSong) {
            
            var currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
            
            con.query( 
                'INSERT INTO ' + cfg.tableName + ' (Artist, SongName, Time) VALUES ("' + mysql.escape(currentSong.data.now[0].artist) + '","' + mysql.escape(currentSong.data.now[0].title) + '","' + currentTime + '");', function (err) {
                    if (err)
                        console.log('An error occurred: ' + err.message)
                    else
                        console.log(currentSong.data.now[0].artist + ' - ' + currentSong.data.now[0].title + ' has been added to DB')
                    
                    console.log('==========================')
                })
        }
        else {
            console.log(currentSong.data.now[0].artist + ' - ' + currentSong.data.now[0].title + ' has already been added')
            console.log('==========================')
        }
    }
    else {
        console.log('There is no song playing at the moment')
        console.log('==========================')
    }
}

//Check if a new song is playing every 5 seconds
var checkInterval = setInterval(function () {
    //Instantiate parser object
    var parser = new xml2js.Parser('UTF-8')

    //Listen for any completed parses
    parser.addListener('end', function (result) {
        var res = JSON.stringify(result)
        currentSong = result
        if (JSON.stringify(lastModified) != JSON.stringify(currentSong.data.updated)) {
            lastModified = currentSong.data.updated
            runQuery()
        }
    })
    
    //Connect to url and parse data
    http.get('http://kvf.fo/service/now-next.xml', function (res) {
        res.on('data', function (chunk) {
            parser.parseString(chunk)
        })
    }).on('error', function (e) {
        console.log('Got error: ' + e.message)
    })
}, 1000)