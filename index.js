const express = require('express')
const bodyParser = require('body-parser')
const geoip = require('geoip-lite')
const request = require('superagent')

const app = express()

const WEATHER_KEY=process.env.WEATHER_API_KEY
const DRIFT_TOKEN=process.env.DRIFT_TOKEN

const CONVERSATION_API_BASE = 'https://driftapi.com/v1/conversations'
const WEATHER_BASE_URL=`https://api.openweathermap.org/data/2.5/weather?APPID=${WEATHER_KEY}`

const getClientIP = (req) => {
  return req.headers['x-forwarded-for'].split(',').pop() ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.connection.socket.remoteAddress
}

const createResMessage = (orgId, mbody, mtype) => {
  const message = {
    'orgId': orgId,
    'body': mbody,
    'type': mtype,
  }
  return message
}

const handleWeather = (lat, lon, city, orgId, convId) => {
  const weather_url = WEATHER_BASE_URL+`&lat=${lat}&lon=${lon}`
  return request.get(weather_url)
    .then((res) => {
        // const temp = res.text.main.temp
        // const feel = res.text.weather.description
        const obj = JSON.parse(res.text)
        const ts = JSON.stringify(obj.weather[0]['description'])
        const message = `<p>It is currently ${ts}` // degrees and ${feel}</p>`

        sendMessage(convId, createResMessage(orgId, message, 'private_note'))
    })
    .catch(err => console.log(err))
}

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
  if (data.type === 'private_note') {
    const mbody = data.body
    const conversationId = data.conversationId
    if (mbody.startsWith('/weather')) {
      const geo = geoip.lookup(ip_addr)
      const lat = geo.ll[0]
      const lon = geo.ll[1]
      const city = geo.city
      sendMessage(conversationId, createDeleteMessage(orgId, data.id))
      return handleWeather(lat, lon, city, orgId, conversationId)
    }
  }
}

app.use(bodyParser.json())
app.listen(process.env.PORT || 3000, () => console.log('Example app listening on port 3000!'))
app.post('/event_api', (req, res) => {
  const ip_addr = getClientIP(req)
  // if (req.body.type === 'new_conversation') {
  //   handleNewConversation(req.body.orgId, req.body.data, ip_addr)
  // }
  if(req.body.type === 'new_message'){
    handleWeatherMessage(req.body.orgId, req.body.data, ip_addr)
  }
  return res.send('ok')
})
