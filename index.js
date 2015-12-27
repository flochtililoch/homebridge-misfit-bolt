/* jshint node: true */
"use strict";

var debug = require('debug')('homebridge-misfit-bolt');
var _ = require('lodash');
var Color = require('color');

var Service, Characteristic, uuid;
var Bolt = require('misfit-bolt');

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerPlatform("homebridge-misfit-bolt", "MisfitBolt", MisfitBoltPlatform);
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
    var accessory = new MisfitBoltAccessory(bolt, config);
    accessories.push(accessory);
    accessory.initialize(function() {
      if (accessories.length == configs.length) {
        callback(accessories);
      }
    });
  });
};

function MisfitBoltAccessory(bolt, config) {
  this.bolt = bolt;
  this.name = config.name;
}

MisfitBoltAccessory.prototype.initialize = function (callback) {
  var bolt = this.bolt,
      that = this;

  bolt.connect(function(error) {
    bolt.getRGBA(function(error, rgba) {
      debug('Initial RGBA:', rgba);
      that.color = new Color(`rgba(${rgba})`);
      that.brightness = rgba.pop();
      callback();
    });
  });
};

MisfitBoltAccessory.prototype.getServices = function () {
  var lightbulbService = new Service.Lightbulb(this.name),
      bolt = this.bolt;

  lightbulbService
    .getCharacteristic(Characteristic.On)
    .on('set', _.bind(this.setState, this))
    .on('get', _.bind(this.getState, this));

  lightbulbService
    .getCharacteristic(Characteristic.Hue)
    .on('set', _.bind(this.setHue, this))
    .on('get', _.bind(this.getHue, this));

  lightbulbService
    .getCharacteristic(Characteristic.Saturation)
    .on('set', _.bind(this.setSaturation, this))
    .on('get', _.bind(this.getSaturation, this));

  lightbulbService
    .getCharacteristic(Characteristic.Brightness)
    .on('set', _.bind(this.setBrightness, this))
    .on('get', _.bind(this.getBrightness, this));

  return [lightbulbService];
};

MisfitBoltAccessory.prototype.setState = function (state, callback) {
  var bolt = this.bolt;
  bolt.connect(function() {
    bolt[state ? 'on': 'off'](function(){
      bolt.disconnect(callback);
    });
  });
};

MisfitBoltAccessory.prototype.getState = function (callback) {
  var bolt = this.bolt;
  bolt.connect(function() {
    bolt.getState(function(state) {
      debug('Getting state:', state);
      bolt.disconnect(function() {
        callback(callback);
      });
    });
  });
};

MisfitBoltAccessory.prototype.setRGBA = function (callback) {
  var rgba = this.color.rgbArray().concat(this.brightness);
  debug('setRGBA: ', rgba);
  var bolt = this.bolt;
  bolt.connect(function() {
    bolt.setRGBA(rgba, callback);
  });
};

MisfitBoltAccessory.prototype.getRGBA = function (callback) {
  var bolt = this.bolt,
      that = this;
  bolt.connect(function(error) {
    bolt.getRGBA(function(error, rgba) {
      debug('getRGBA:', rgba);
      that.color = new Color(`rgba(${rgba})`);
      that.brightness = rgba.pop();
      bolt.disconnect(function() {
        callback();
      });
    });
  });
};

MisfitBoltAccessory.prototype.setHue = function (hue, callback) {
  debug('Setting hue: ', hue);
  this.color.hue(hue);
  this.setRGBA(callback);
};

MisfitBoltAccessory.prototype.getHue = function (callback) {
  debug('Getting hue');
  this.getRGBA(function() {
    callback(this.color.hue());
  });
};

MisfitBoltAccessory.prototype.setSaturation = function (saturation, callback) {
  debug('Setting saturation: ', saturation);
  this.color.saturationv(saturation);
  this.setRGBA(callback);
};

MisfitBoltAccessory.prototype.getSaturation = function (callback) {
  debug('Getting saturation');
  this.getRGBA(function() {
    callback(this.color.saturation());
  });
};

MisfitBoltAccessory.prototype.setBrightness = function (brightness, callback) {
  debug('Setting brightness: ', brightness);
  this.brightness = brightness;
  this.setRGBA(callback);
};

MisfitBoltAccessory.prototype.getBrightness = function (callback) {
  debug('Getting saturation');
  this.getRGBA(function() {
    callback(this.brightness);
  });
};
