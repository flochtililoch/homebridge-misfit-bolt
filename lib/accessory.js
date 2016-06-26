"use strict";

const _bind = require('lodash').bind,
      superagent = require('superagent'),
      get = superagent.get,
      put = superagent.put;

var Service, Characteristic;

class MisfitBoltAccessory {

  constructor(config, log) {
    this.id = config.id;
    this.name = config.name;
    this.baseUrl = config.baseUrl;
    this.log = log;
  }

  url(property) {
    return `${this.baseUrl}/${property}`;
  }

  getServices() {
    const service = new Service.Lightbulb(this.name);
    
    const wrap = (characteristic, property) => {
      const responseHandler = (callback) => {
        return (err, res) => {
          var body = null;
          if (res && res[property]) {
            body = res[property]
          }
          callback(err, body);
        };
      };

      const getter = (callback) => {
        this.log(`Get Bolt#${this.id} ${property}`);
        get(this.url(property)).end(responseHandler(callback));
      };

      const setter = (value, callback) => {
        this.log(`Set Bolt#${this.id} ${property} with ${value}`);
        var body = {};
        body[property] = value;
        put(this.url(property))
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

    return [service];
  }

}

module.exports = (hap) => {
  Service = hap.Service;
  Characteristic = hap.Characteristic;
  return MisfitBoltAccessory;
};
