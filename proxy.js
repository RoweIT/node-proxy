var httpProxy = require("http-proxy");
var http = require("http");
var url = require("url");
var net = require('net');

const config = {
  port: 8012,
  urlRegex: ".*",
  headerRegex: null
};

function resolveSettings() {
  for (let i = 0; i < process.argv.length; i++) {
      if(i <= 1) continue; //ignore node call and index file location
  
      const arg = process.argv[i];
      const info = arg.split(":");
      config[info[0]] = info [1];
  }
}

resolveSettings();
console.log("Config:\r\n" + JSON.stringify(config, null, "\t"));

config.urlRegex = new RegExp(config.urlRegex);
config.headerRegex = new RegExp(config.headerRegex);

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

  if (config.urlRegex.test(req.url)) console.log("HTTP - ", req.url);
  handleHeaderLogging(req);
}).listen(config.port);  //this is the port your clients will connect to
console.log("Proxy started");

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

function handleHeaderLogging(req) {
  if(config.headerRegex != null) {
    Object.keys(req.headers).forEach(headerName => {
      if (config.headerRegex.test(headerName) || config.headerRegex.test(req.headers[headerName])) {
        console.log("Header match for", req.headers.host, "-", `"${headerName}: ${req.headers[headerName]}"`);
      }
    });
  }
}

server.addListener('connect', function (req, socket, bodyhead) {
  var hostPort = getHostPortFromString(req.url, 443);
  var hostDomain = hostPort[0];
  var port = parseInt(hostPort[1]);

  if (config.urlRegex.test(req.url)) console.log("HTTPS - ", req.url);
  handleHeaderLogging(req);

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