const express = require('express')
const bodyParser = require('body-parser')
const geoip = require('geoip-lite') //https://github.com/bluesmoon/node-geoip
const superagent = require('superagent')

const app = express()
//Environment Vars
const WEATHER_KEY=process.env.WEATHER_API_KEY  //https://openweathermap.org/current
const DRIFT_TOKEN=process.env.DRIFT_TOKEN
// URL BASES
const WEATHER_BASE_URL='api.openweathermap.org/data/2.5/weather?APPID='+WEATHER_KEY

//HELPER METHODS
const getClientIP = (req) => {
  return req.header('x-forwarded-for') || req.connection.remoteAddress;
}

const getCoordinates = (ip) => {
  geo = geoip.lookup(ip)
  return geo.ll
}
//HANDLE METHODS
const handleNewConversation = (orgId, data, ip_addr) => {
    var ll = getCoordinates(ip_addr)

    var lat = ll[0]
    var lon = ll[1]

    
}
//SET UP APP
app.use(bodyParser.json())
app.listen(process.env.PORT || 3000, () => console.log('Example app listening on port 3000!'))
app.post('/event_api', (req, res) => {

  if (req.body.type === 'new_conversation') {
    ip_addr = getClientIP(req)
    handleNewConversation(req.body.orgId, req.body.data, ip_addr)
  }

  return res.send('ok')
})
