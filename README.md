# homebridge-misfit-bolt

Misfit Bolt plugin for [Homebridge](https://github.com/nfarina/homebridge).
Let you control your Misfit Bolt via HomeKit / Siri. Requires [misfit-bolt-http](https://github.com/flochtililoch/misfit-bolt-http) module running as a separate program.

# Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-misfit-bolt`
3. Update your configuration file. See the sample below.

# Configuration

## Configuration sample

 ```json
  "platforms": [
      {
          "platform": "MisfitBolt",
          "name": "MisfitBolt",
          "accessories": [{
            "id": "20338f8afaac",
            "name": "Bolt",
            "baseUrl": "http://localhost:3000/20338f8afaac"
          }]
      }
  ]
```

## Accessories Required properties

### `id`

Identifier of your Misfit Bolt.

On Linux, this corresponds to the bluetooth address of the bulb. You can find out your identifier using the following command:

```bash
$ sudo hcitool lescan
LE Scan ...
20:33:8F:8A:FA:AC MFBOLT
```

will become in your config:

```json
{
  "id": "20338f8afaac",
  "name": "Bolt"
}

```

**Note:**
On OSX, the `id` field is a UUID which differs from the bluetooth address.


### `name`

Name of your Bolt, as you want it to appear in your HomeKit supported app.


### `baseUrl`

URL of the Bolt as exposed via `misfit-bolt-http` module. See [misfit-bolt-http](https://github.com/flochtililoch/misfit-bolt-http) for setup and configuration details.


# TODO

- Tests

