var Bolt = require('misfit-bolt');
var _ = require('lodash');

var MisfitBoltAccessory;

module.exports = function (hap) {
  MisfitBoltAccessory = require('./accessory')(hap);
  return MisfitBoltPlatform;
};

function MisfitBoltPlatform(log, config) {
  this.log = log;
  this.config = config;
  this.log("Misfit Plugin Loaded");
}

MisfitBoltPlatform.prototype.accessories = function(callback) {
  this.log("Fetching Misfit Bolts");

  var that = this;
  var configs = this.config.accessories;
  var accessories = [];

  Bolt.discover(function(bolt) {
    var config = _.find(configs, function(c) {
      return c.id === bolt.id;
    });
    var accessory = new MisfitBoltAccessory(bolt, config, that.log);
    accessories.push(accessory);

    var totalAccessories = accessories.length;
    accessory.initialize(function() {
      if (totalAccessories == configs.length) {
        callback(accessories);
      }
    });
  });
};
