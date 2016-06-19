//Import required modules
var xml2js = require('xml2js') //Used for converting between XML and JSON
var http = require('http') //Used for connecting to XML sheet
var mysql = require('mysql')//Used for connecting to database and executing queries
var dotenv = require('dotenv')
dotenv.config()

var cfg = require('./config.js')

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

console.log(new Date().toISOString().slice(0, 19).replace('T', ' '))

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
        else 
            lastSong = JSON.stringify(rows[0].Artist).slice(2, -2) + JSON.stringify(rows[0].SongName).slice(2, -2)
    }
)

//=================================================
//Run the actual query.
//This function will insert the current song into
//the database
//=================================================
function runQuery() {
    console.log(new Date())
    if (currentSong.data.now[0].artist != '' && currentSong.data.now[0].title != '') {
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
}, 5000)