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
        const message = `<p>It is currently ${temp} degrees and ${feel} in ${city}</p>`

        sendMessage(convId, createMessage(orgId, message, 'chat'))
    })
    .catch(err => console.log(err))
}
//HANDLE METHODS
const createDeleteMessage = (orgId, idToDelete) => {
   return {
    orgId,
    type: 'edit',
    editedMessageId: idToDelete,
    editType: 'delete',
    body: ''
   }
}

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

const handleWeatherMessage = (orgId, data, ip_addr) => {
  const body = data.body
  const conversationId = data.conversationId
  if (body.startsWith('/weather')) {
    sendMessage(conversationId, createDeleteMessage(orgId, data.id))
    return getGifAndSendMessage(orgId, conversationId, conversationId, searchParam, data.id)
  }
}
//SET UP APP

app.use(bodyParser.json())
app.listen(process.env.PORT || 3000, () => console.log('Example app listening on port 3000!'))
app.post('/event_api', (req, res) => {
  const ip_addr = getClientIP(req)

  if (req.body.type === 'new_conversation') {
    handleNewConversation(req.body.orgId, req.body.data, ip_addr)
  }
  if(req.body.type === 'new_message'){
    handleWeatherMessage(req.body.orgId, req.body.data, ip_addr)
  }

  return res.send('ok')
})
