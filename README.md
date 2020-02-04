# node-proxy
Simple proxy in js

# Setup

```cmd
> cd repo/location/
> npm i
```

# Usage

```cmd
> node .\proxy.js <config:value>
```

Default config options:
```
port: 8012
urlRegex:.*
headerRegex: null
```

eg - `node .\proxy.js port:8080 urlRegex:example.com headerRegex:gzip` would result in output of
```
HTTP -  http://example.com/
Header match for example.com - "accept-encoding: gzip, deflate"
```
when a naviagtion to http://example.com occurs.

Note that the regex is tested separately for the header name and value respectively, and spaces are not allowed.

Also note that most headers are encrypted over https and so will not be visible to the proxy.