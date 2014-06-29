var http = require('http')

function send(res, code) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'X-Requested-With, X-API-Token, X-API-Version'
  })
  res.end()
}

var server = http.createServer(function (req, res) {
  if (req.method === 'OPTIONS') {
    return send(res, 200)
  }
  if (req.headers['x-api-token']) {
    send(res, 200)
  } else {
    send(res, 403)
  }
})

server.listen(3000)
console.log('Server is listening in port 3000')
