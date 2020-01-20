var httpProxy = require("http-proxy");
var http = require("http");
var url = require("url");
var net = require('net');
var port = 8012;

let regex = ".*";
if(process.argv.length > 2) {
  port = Number(process.argv[2]);
  if(process.argv.length > 3) {
    regex = process.argv[3];
  }
}

console.log("Will print matches to '" + regex + "'");
regex = new RegExp(regex);

var server = http.createServer(function (req, res) {
  var urlObj = url.parse(req.url);
  var target = urlObj.protocol + "//" + urlObj.host;

  var proxy = httpProxy.createProxyServer({});
  proxy.on("error", function (err, req, res) {
    console.log("proxy error", err, req.url);
    let message = err.toString() + " " + req.url;
    res.statusCode = 500;
    res.setHeader("Content-Length", Buffer.byteLength(message));
    res.write(message);
    res.end();
  });

  proxy.web(req, res, {target: target});

  if (regex.test(req.url)) console.log("HTTP - ", req.url);
  console.log(req.headers["backend"]);
}).listen(port);  //this is the port your clients will connect to
console.log("Ready on :", port, "...");

var regex_hostport = /^([^:]+)(:([0-9]+))?$/;

var getHostPortFromString = function (hostString, defaultPort) {
  var host = hostString;
  var port = defaultPort;

  var result = regex_hostport.exec(hostString);
  if (result != null) {
    host = result[1];
    if (result[2] != null) {
      port = result[3];
    }
  }

  return ( [host, port] );
};

server.addListener('connect', function (req, socket, bodyhead) {
  var hostPort = getHostPortFromString(req.url, 443);
  var hostDomain = hostPort[0];
  var port = parseInt(hostPort[1]);
  
  if (regex.test(req.url)) console.log("HTTPS - ", req.url);

  var proxySocket = new net.Socket();
  proxySocket.connect(port, hostDomain, function () {
      proxySocket.write(bodyhead);
      socket.write("HTTP/" + req.httpVersion + " 200 Connection established\r\n\r\n");
    }
  );

  proxySocket.on('data', function (chunk) {
    socket.write(chunk);
  });

  proxySocket.on('end', function () {
    socket.end();
  });

  proxySocket.on('error', function () {
    socket.write("HTTP/" + req.httpVersion + " 500 Connection error\r\n\r\n");
    socket.end();
  });

  socket.on('data', function (chunk) {
    proxySocket.write(chunk);
  });

  socket.on('end', function () {
    proxySocket.end();
  });

  socket.on('error', function () {
    proxySocket.end();
  });

});