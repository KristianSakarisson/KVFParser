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
    res.sendFile(__dirname + '/index.html')
})

app.get('/js/socket.js', function(req, res) {
    res.sendFile(__dirname + '/public/socket.js')
})

app.get('/js/env.js', function(req, res) {
    res.sendFile(__dirname + '/public/env.js')
})


app.listen(8080, function() {
	console.log('App is listening on port 8080')
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
    getLastSong()
})

//Find last song played 
function getLastSong() {
    con.query(
        'SELECT * FROM ' + cfg.tableName + ' ORDER BY ID DESC LIMIT 1', function (e, rows){
            if (e)
                console.log('Error: ' + e.message)
            else {
            	if(rows.length > 0) {
                	lastSong = JSON.stringify(rows[0].Artist).slice(2, -2) + 
                    ' ' + 
                    JSON.stringify(rows[0].SongName).slice(2, -2)
                }
                else {
                	lastSong = ""
                }
                //return lastSong
            }
        }
    )
}

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
        if (JSON.stringify(currentSong.data.now[0].artist).slice(2, -2) +  
            ' ' +  
            JSON.stringify(currentSong.data.now[0].title).slice(2, -2) != lastSong) {
            
            var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
            var currentTime = new Date(Date.now() - tzoffset).toISOString().slice(0, 19).replace('T', ' ')
            
            con.query( 
                'INSERT INTO ' + cfg.tableName + ' (Artist, SongName, Time) VALUES ("' + mysql.escape(currentSong.data.now[0].artist) + '","' + mysql.escape(currentSong.data.now[0].title) + '","' + currentTime + '");', function (err) {
                    if (err) {
                        console.log('An error occurred: ' + err.message)
                    }
                    else {
                        console.log(currentSong.data.now[0].artist + ' - ' + currentSong.data.now[0].title + ' has been added to DB')
                        con.query('SELECT * FROM spotifylinks WHERE Artist="' + mysql.escape(currentSong.data.now[0].artist) + '" AND SongName="' + mysql.escape(currentSong.data.now[0].title) + '"', function(err, data) {
                            if(err) {
                                console.log(err)
                            }
                            else {
                                if(data.length == 0) {
                                    con.query('INSERT INTO spotifylinks (Artist, SongName) VALUES ("' + mysql.escape(currentSong.data.now[0].artist) + '","' + mysql.escape(currentSong.data.now[0].title) + '");', function (err) {
                                        if(err) {
                                            console.log(err)
                                        }
                                        else {
                                            console.log('Song inserted into spotifylinks')
                                        }
                                    })
                                }
                            }
                        })
                    }
                    
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

//Check if a new song is playing every second
var checkInterval = setInterval(function () {
    getLastSong()
    //Instantiate parser object
    var parser = new xml2js.Parser('UTF-8')

    //Listen for any completed parses
    parser.addListener('end', function (result) {
        var res = JSON.stringify(result)
        currentSong = result
        if (JSON.stringify(lastModified) != JSON.stringify(currentSong.data.updated || currentSong.data.now[0].artist[0] !== '')) {
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