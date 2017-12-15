const express = require('express')
const bodyParser = require('body-parser')
const geoip = require('geoip-lite')
const superagent = require('superagent')

const app = express()


//app.get('/', (req, res) => res.send('Hello World!'))

//app.listen(3000, () => console.log('Example app listening on port 3000!'))
app.use(bodyParser.json())
app.listen(process.env.PORT || 3000, () => console.log('Example app listening on port 3000!'))
app.post('/api', (req, res) => {
  if (req.body.type === 'new_message') {
    handleMessage(req.body.orgId, req.body.data)
  }
  if (req.body.type === 'button_action') {
    handleButton(req.body.orgId, req.body.data)
  }
  return res.send('ok')
})
