const express = require('express')
const bodyParser = require('body-parser')
const geoip = require('geoip-lite') //https://github.com/bluesmoon/node-geoip
const superagent = require('superagent')

const app = express()
//Environment Vars
const WEATHER_KEY=process.env.WEATHER_API_KEY  //https://openweathermap.org/current
const DRIFT_TOKEN=process.env.DRIFT_TOKEN
// URL BASES
const CONVERSATION_API_BASE = 'https://driftapi.com/v1/conversations'
const WEATHER_BASE_URL=`https://api.openweathermap.org/data/2.5/weather?APPID=${WEATHER_KEY}`

//HELPER METHODS
const getClientIP = (req) => {
  return req.header('x-forwarded-for') || req.connection.remoteAddress;
}

// const getCoordinates = (ip) => {
//   var geo = geoip.lookup(ip)
//   return geo.ll
// }
const createMessage = (orgId, body, type) => {
  return {
    'orgId': orgId,
    'body': body,
    'type': type,
  }
}

const handleWeather = (lat, lon, city, orgId, convId) => {
  var url = WEATHER_BASE_URL+`&lat=${lat}&lon=${lon}`
  return request.get(url)
    .then((res) => {
        const temp = res.main.temp
        const feel = res.weather.description
        const message = `It is currently ${temp} degrees and ${feel} in ${city}`

        sendMessage(convId, createMessage(orgId, message, 'chat'))
    })
    .catch(err => console.log(err))
}
//HANDLE METHODS
// const createDeleteMessage = (orgId, idToDelete) => {
//    return {
//     orgId,
//     type: 'edit',
//     editedMessageId: idToDelete,
//     editType: 'delete',
//     body: ''
//    }
// }

const sendMessage = (conversationId, message) => {
  return request.post(CONVERSATION_API_BASE + `/${conversationId}/messages`)
    .set('Content-Type', 'application/json')
    .set(`Authorization`, `bearer ${DRIFT_TOKEN}`)
    .send(message)
    .catch(err => console.log(err))
}

const handleNewConversation = (orgId, data, ip_addr) => {
    const geo = geoip.lookup(ip_addr)
    const lat = geo.ll[0]
    const lon = geo.ll[1]
    const city = geo.city

    return handleWeather(lat, lon, city, orgId, data.conversationId)
}
//SET UP APP
function sendFile(res, filename, type) {

  type = type || 'text/html'

  res.writeHead(200, {'Content-type': type})

  var stream = fs.createReadStream(filename)

  stream.on('data', function(data) {
    res.write(data);
  })

  stream.on('end', function(data) {
    res.end();
    return;
  })
}

app.use(bodyParser.json())
app.listen(process.env.PORT || 3000, () => console.log('Example app listening on port 3000!'))
app.get('/', (req, res) => sendFile(res, 'home.html'))
app.post('/event_api', (req, res) => {

  if (req.body.type === 'new_conversation') {
    var ip_addr = getClientIP(req)
    handleNewConversation(req.body.orgId, req.body.data, ip_addr)
  }

  return res.send('ok')
})
