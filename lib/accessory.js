var debug = require('debug')(require('../package').name);
var _ = require('lodash');
var Color = require('color');

var Service, Characteristic;

module.exports = function (hap) {
  Service = hap.Service;
  Characteristic = hap.Characteristic;
  return MisfitBoltAccessory;
};

function MisfitBoltAccessory(bolt, config, log) {
  this.bolt = bolt;
  this.name = config.name;
  this.log = log;
}

MisfitBoltAccessory.prototype.initialize = function (callback) {
  var bolt = this.bolt,
      that = this;

  bolt.connect(function(error) {
    bolt.getRGBA(function(error, rgba) {
      debug('Initial RGBA:', rgba);
      that.color = new Color(`rgba(${rgba})`);
      that.brightness = rgba.pop();
      bolt.disconnect(callback);
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

MisfitBoltAccessory.prototype.set = function (method, value, callback) {
  var bolt = this.bolt,
      params = [],
      done = function() {
        bolt.disconnect(function() {});
      };

  if (value !== undefined) {
    params.push(value);
  }
  params.push(done);

  clearTimeout(this.settingTimer);
  this.settingTimer = setTimeout(function(){
    debug('Bolt called with: ', method, params);
    bolt.connect(function() {
      bolt[method].apply(bolt, params);
    });
  }, 10);

  callback();
};

MisfitBoltAccessory.prototype.get = function (method, callback) {
  var bolt = this.bolt;
  bolt.connect(function() {
    bolt[method](function(error, value) {
      bolt.disconnect(function() {
        callback(value);
      });
    });
  });
};

MisfitBoltAccessory.prototype.setState = function (state, callback) {
  var that = this;
  this.log('Setting state: ', state);
  this.set(state ? 'on': 'off', undefined, function() {
    that.log('State set: ', state);
    callback();
  });
};

MisfitBoltAccessory.prototype.getState = function (callback) {
  var that = this;
  this.log('Getting state');
  this.get('getState', function(state) {
    that.log('Got state: ', state);
    callback(state);
  });
};

MisfitBoltAccessory.prototype.setRGBA = function (callback) {
  var rgba = this.color.rgbArray().concat(this.brightness);
  debug('Setting RGBA: ', rgba);
  this.set('setRGBA', rgba, function() {
    debug('RGBA set: ', rgba);
    callback();
  });
};

MisfitBoltAccessory.prototype.getRGBA = function (callback) {
  debug('Getting RGBA');
  var that = this;
  this.get('getRGBA', function(rgba) {
    debug('Got RGBA: ', rgba);
    that.color = new Color(`rgba(${rgba})`);
    that.brightness = rgba.pop();
    callback(rgba);
  });
};

MisfitBoltAccessory.prototype.setHue = function (hue, callback) {
  var that = this;
  this.log('Setting hue: ', hue);
  this.color.hue(hue);
  this.setRGBA(function() {
    that.log('Hue set: ', hue);
    callback();
  });
};

MisfitBoltAccessory.prototype.getHue = function (callback) {
  var that = this;
  this.log('Getting hue');
  this.getRGBA(function() {
    that.log('Got hue: ', this.color.hue());
    callback(this.color.hue());
  });
};

MisfitBoltAccessory.prototype.setSaturation = function (saturation, callback) {
  this.log('Setting saturation: ', saturation);
  this.color.saturationv(saturation);
  this.setRGBA(function() {
    that.log('Saturation set: ', saturation);
    callback();
  });
};

MisfitBoltAccessory.prototype.getSaturation = function (callback) {
  var that = this;
  this.log('Getting saturation');
  this.getRGBA(function() {
    that.log('Got saturation: ', this.color.saturation());
    callback(this.color.saturation());
  });
};

MisfitBoltAccessory.prototype.setBrightness = function (brightness, callback) {
  var that = this;
  this.log('Setting brightness: ', brightness);
  this.brightness = brightness;
  this.setRGBA(function() {
    that.log('Brightness set: ', brightness);
    callback();
  });
};

MisfitBoltAccessory.prototype.getBrightness = function (callback) {
  var that = this;
  this.log('Getting brightness');
  this.getRGBA(function() {
    that.log('Got brightness: ', this.brightness);
    callback(this.brightness);
  });
};
