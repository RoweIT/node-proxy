# node-proxy
Simple proxy in js

# Setup

```cmd
> cd repo/location/
> npm i
```

# Usage

```cmd
> node .\proxy.js <port> <regex>
```

- Port is optional, and defaults to `8012` if unset.
- Regex is optional and defaults to all (`.*`). This is used to filter what urls are printed to console.