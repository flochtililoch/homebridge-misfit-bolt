"use strict";

const debug = require('debug')(require('../package').name),
      superagent = require('superagent-cache')(),
      get = superagent.get,
      patch = superagent.patch;

var Service, Characteristic;

class MisfitBoltAccessory {

  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.baseUrl = config.baseUrl;
  }

  getServices() {
    return [
      this.lightbulbService(),
      this.informationService()
    ];
  }

  lightbulbService() {
    const service = new Service.Lightbulb(this.name);

    const wrap = (characteristic, property) => {
      const responseHandler = (callback) => {
        return (err, res) => {
          var body = null;
          if (res && res.body && res.body[property]) {
            body = res.body[property];
            debug(`Got ${property}: ${body}`);
          }
          callback(err, body);
        };
      };

      const getter = (callback) => {
        debug(`Get Bolt#${this.id} ${property}`);
        get(this.baseUrl).end(responseHandler(callback));
      };

      const setter = (value, callback) => {
        debug(`Set Bolt#${this.id} ${property} with ${value}`);
        var body = {};
        body[property] = value;
        patch(this.baseUrl)
          .send(body)
          .end(responseHandler(callback));
      };

      service.getCharacteristic(characteristic)
        .on('get', getter)
        .on('set', setter);
    };

    wrap(Characteristic.On, 'state');
    wrap(Characteristic.Hue, 'hue');
    wrap(Characteristic.Saturation, 'saturation');
    wrap(Characteristic.Brightness, 'brightness');

    return service;
  }

  informationService() {
    const service = new Service.AccessoryInformation();

    service
      .setCharacteristic(Characteristic.Manufacturer, 'MISFIT')
      .setCharacteristic(Characteristic.Model, 'BOLT')
      .setCharacteristic(Characteristic.SerialNumber, 'unknown')
      .setCharacteristic(Characteristic.Name, this.name);

    return service;
  }

}

module.exports = (hap) => {
  Service = hap.Service;
  Characteristic = hap.Characteristic;
  return MisfitBoltAccessory;
};
