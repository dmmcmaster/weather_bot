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
app.use(bodyParser.json())
app.listen(process.env.PORT || 3000, () => console.log('Example app listening on port 3000!'))
app.post('/event_api', (req, res) => {

  if (req.body.type === 'new_conversation') {
    var ip_addr = getClientIP(req)
    handleNewConversation(req.body.orgId, req.body.data, ip_addr)
  }

  return res.send('ok')
})

//<script>
!function() {
  var t;
  if (t = window.driftt = window.drift = window.driftt || [], !t.init) return t.invoked ? void (window.console && console.error && console.error("Drift snippet included twice.")) : (t.invoked = !0,
  t.methods = [ "identify", "config", "track", "reset", "debug", "show", "ping", "page", "hide", "off", "on" ],
  t.factory = function(e) {
    return function() {
      var n;
      return n = Array.prototype.slice.call(arguments), n.unshift(e), t.push(n), t;
    };
  }, t.methods.forEach(function(e) {
    t[e] = t.factory(e);
  }), t.load = function(t) {
    var e, n, o, i;
    e = 3e5, i = Math.ceil(new Date() / e) * e, o = document.createElement("script"),
    o.type = "text/javascript", o.async = !0, o.crossorigin = "anonymous", o.src = "https://js.driftt.com/include/" + i + "/" + t + ".js",
    n = document.getElementsByTagName("script")[0], n.parentNode.insertBefore(o, n);
  });
}();
drift.SNIPPET_VERSION = '0.3.1';
drift.load('6m8kenu769iv');
//</script>
