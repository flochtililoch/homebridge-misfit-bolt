# homebridge-misfit-bolt

Misfit Bolt plugin for [Homebridge](https://github.com/nfarina/homebridge).

# Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-misfit-bolt`
3. Update your configuration file. See the sample below.

# Updating

1. npm update -g homebridge-misfit-bolt

# Configuration

Configuration sample:

 ```json
  "platforms": [
      {
          "platform": "MisfitBolt",
          "name": "MisfitBolt",
          "accessories": [{
            "id": "1fd6828fedbd431aa38f48683b1ed92a",
            "name": "Bolt",
            "disconnectTimeout": 5000
          }]
      }
  ]
```

The module will fetch all your Misfit Bolts listed in `platform.accessories` and make them available to HomeBridge / HomeKit / Siri.
Each accessory should have the following properties:

#### `id`:

UUID of your misfit bolt as recognized by your system. On linux, you can find out your UUIDs using the following command:

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

#### `name`:

Name of your Bolt, as you want it to appear in your Homekit supported app.


#### `disconnectTimeout`: (optional, default to 10000)

Time in millisecond after which homebridge will disconnect from the bulb, so that it can be discovered by other BLE enabled devices (useful if you want to keep using the original Misfit Bolt app in parallel of using homebridge).


# TODO

Unit tests.
