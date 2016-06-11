"use strict";

var MisfitBoltAccessory;

class MisfitBoltPlatform {

  constructor(log, config) {
    this.log = log;
    this.config = config;
    this.log("Misfit Plugin Loaded");
  }

  accessories(callback) {
    var accessories = [];

    this.config.accessories.forEach((config) => {
      var accessory = new MisfitBoltAccessory(config, this.log);
      accessories.push(accessory);
    });

    callback(accessories);
  }

}

module.exports = (hap) => {
  MisfitBoltAccessory = require('./accessory')(hap);
  return MisfitBoltPlatform;
};
