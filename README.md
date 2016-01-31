# homebridge-misfit-bolt

Misfit Bolt plugin for [Homebridge](https://github.com/nfarina/homebridge).
Let you control your Misfit Bolt via HomeKit / Siri.

# Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-misfit-bolt`
3. Update your configuration file. See the sample below.

# Updating

1. npm update -g homebridge-misfit-bolt

# Configuration

## Generate configuration

After installing the plugin, you can run the following command if you want to generate your configuration automatically. This script helps finding surrounding Bolts, and outputs the required JSON configuration.
```bash
/usr/local/lib/node_modules/homebridge-misfit-bolt/generate-config
```

## Configuration sample

 ```json
  "platforms": [
      {
          "platform": "MisfitBolt",
          "name": "MisfitBolt",
          "loadTimeout": 30000,
          "accessories": [{
            "id": "1fd6828fedbd431aa38f48683b1ed92a",
            "name": "Bolt",
            "timeout": 500,
            "disconnectTimeout": 5000
          }]
      }
  ]
```

## Accessories

### Required properties

#### `id`

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


#### `name`

Name of your Bolt, as you want it to appear in your Homekit supported app.


### Optional properties

#### `loadTimeout` (in milliseconds, optional, defaults to no timeout)

Time after which homebridge will stop attempting to connect to configured bolts. Helpful when all configured bolts aren't plugged in.

#### `timeout` (in milliseconds, optional, default to `1000`)

Time after which homebridge will abort any pending interaction with the bulb, such as connecting or setting values.


#### `disconnectTimeout` (in milliseconds, optional, default to `10000`)

Time after which homebridge will disconnect from the bulb.
Useful if you want to keep using the original Misfit Bolt app in parallel of using homebridge. Next time a command is sent via homebridge, a reconnection will be attempted.


# TODO

- Move implementation that keep track of state, and allows manipulation of Hue / Brightness / Saturation to [`misfit-bolt`](https://github.com/flochtililoch/misfit-bolt) module.
- Unit tests.

