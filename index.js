const express = require('express')
const bodyParser = require('body-parser')
const geoip = require('geoip-lite')
const superagent = require('superagent')

const app = express()


app.get('/', (req, res) => res.send('Hello World!'))

app.listen(3000, () => console.log('Example app listening on port 3000!'))
