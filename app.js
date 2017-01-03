'use strict'
//Import required modules
const xml2js = require('xml2js') //Used for converting between XML and JSON
const http = require('http') //Used for connecting to XML sheet
const mysql = require('mysql')//Used for connecting to database and executing queries
const dotenv = require('dotenv')
const _ = require('underscore.string') //Used to check if strings contain "illegal" entries
const express = require('express')
const moment = require('moment')
dotenv.config()

const cfg = require('./config.js')
const server = require('./socketServer.js')
const linkUpdater = require('./updateLinks.js')
const spotify = require('./getSpotifyInfo.js')

const app = express()

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.use('/public', express.static('public'))


app.listen(80, () => {
	console.log('App is listening on port 80')
})

let currentSong
let lastModified
let lastSong

//Initialize connection variables
const con = mysql.createConnection({
    host: cfg.dbHost,
    database: cfg.dbName,
    user: cfg.dbLogin,
    password: cfg.dbPassword
})

//Connect to database
con.connect(err => {
    if (err) {
        console.log('Error connecting to DB')
        console.log(err)
        return
    }
    console.log('Connection established')
})

let currentDay = moment().format('DDD')

//Find last song played 
function getLastSong() {
    con.query(
        `SELECT * FROM ${cfg.tableName} ORDER BY ID DESC LIMIT 1`, (e, rows) => {
            if (e)
                console.log('Error: ' + e.message)
            else {
            	if(rows.length > 0) {
                	lastSong = JSON.stringify(rows[0].Artist).slice(2, -2) + 
                    ' ' + 
                    JSON.stringify(rows[0].SongName).slice(2, -2)
                }
                else {
                	lastSong = ''
                }
            }
        }
    )
}

/**
 * Run the actual query.
 * This function will insert the current song into
 * the database
 */
function runQuery() {
    console.log(new Date())
    if (currentSong.data.now[0].artist != '' && 
        currentSong.data.now[0].title != '' && 
        !_.contains(currentSong.data.now[0].title, 'Høvuðstíðindi') && // News theme
        !_.contains(currentSong.data.now[0].title, 'GMF')) { // Separating tune
        if (JSON.stringify(currentSong.data.now[0].artist).slice(2, -2) +  
            ' ' +  
            JSON.stringify(currentSong.data.now[0].title).slice(2, -2) != lastSong) {
            
            const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
            const currentTime = new Date(Date.now() - tzoffset).toISOString().slice(0, 19).replace('T', ' ') // Time formating
            
            con.query( 
                `INSERT INTO ${cfg.tableName} (Artist, SongName, Time) VALUES ("${mysql.escape(currentSong.data.now[0].artist)}","${mysql.escape(currentSong.data.now[0].title)}","${currentTime}");`, err => {
                    if (err) {
                        console.log('An error occurred: ' + err.message)
                    }
                    else {
                        console.log(`${currentSong.data.now[0].artist} - ${currentSong.data.now[0].title} has been added to DB`)
                        con.query(`SELECT * FROM links WHERE Artist="${mysql.escape(currentSong.data.now[0].artist)}" AND SongName="${mysql.escape(currentSong.data.now[0].title)}"`, (err, data) => {
                            if(err) {
                                console.log(err)
                            }
                            else {
                                if(data.length == 0) {
                                    spotify.get({ artist: currentSong.data.now[0].artist, songName: currentSong.data.now[0].title}, false, spotifyInfo => {
                                        let link
                                        if(spotifyInfo.spotifyLink != null) {
                                            link = spotifyInfo.spotifyLink
                                        }
                                        else {
                                            link = 'NULL'
                                        }
                                        con.query(`INSERT INTO links (Artist, SongName, SpotifyURL) VALUES ("${mysql.escape(currentSong.data.now[0].artist)}","${mysql.escape(currentSong.data.now[0].title)}","${link}");`, err => {
                                            if(err) {
                                                console.log(err)
                                            }
                                            else {
                                                console.log('Song inserted into links table. Link: ' + link)
                                            }
                                        })
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
let checkInterval = setInterval(() => {
    getLastSong()
    //Instantiate parser object
    const parser = new xml2js.Parser('UTF-8')

    //Listen for any completed parses
    parser.addListener('end', result => {
        const res = JSON.stringify(result)
        currentSong = result
        if (JSON.stringify(lastModified) != JSON.stringify(currentSong.data.updated || currentSong.data.now[0].artist[0] !== '')) {
            lastModified = currentSong.data.updated
            runQuery()
        }
    })

    //Connect to url and parse data
    http.get('http://kvf.fo/service/now-next.xml', res => {
        res.on('data', chunk => {
            parser.parseString(chunk)
        })
    }).on('error', e => {
        console.log('Got error: ' + e.message)
    })
    if(moment().format('DDD') != currentDay) {
        linkUpdater.update()
        currentDay = moment().format('DDD')
    }
}, 1000)