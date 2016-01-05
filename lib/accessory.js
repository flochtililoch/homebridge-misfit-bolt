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
  this.timeout = config.timeout || 5000;
  this.disconnectTimeout = config.disconnectTimeout || 10000;
}

MisfitBoltAccessory.prototype.initialize = function (callback) {
  this.getRGBA(callback);
};

MisfitBoltAccessory.prototype.disconnect = function () {
  var bolt = this.bolt;
  clearTimeout(this.willDisconnect);
  this.willDisconnect = setTimeout(function() {
    debug('disconnecting')
    bolt.disconnect(function() {
      debug('disconnected')
    });
  }, this.disconnectTimeout);
}

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
  clearTimeout(this.willDisconnect);
  clearTimeout(this.willSet);

  var that = this,
      bolt = that.bolt,
      params = [
        value,
        function() {
          that.disconnect();
        }
      ];

  debug('will set');
  this.willSet = setTimeout(function() {
    debug('setting');
    bolt.connect(function() {
      bolt[method].apply(bolt, params);
      debug('Bolt called with: ', method, params);
    });
  }, 100);
  callback();
};

MisfitBoltAccessory.prototype.get = function (method, callback) {
  clearTimeout(this.willDisconnect);
  var that = this,
      bolt = this.bolt,
      timedout = false,
      timer = setTimeout(function() {
        timedout = true;
        debug('timed out');
        callback();
      }, this.timeout);

  debug('will get');
  bolt.connect(function() {
    bolt[method](function(error, value) {
      that.disconnect();
      clearTimeout(timer);
      if (!timedout) {
        debug('got value:', value);
        callback(value);
      }
    });
  });
};

MisfitBoltAccessory.prototype.setState = function (state, callback) {
  var that = this;
  this.log('Setting state: ', state);
  this.set('setState', state, function() {
    that.log('State set: ', state);
    callback();
  });
};

MisfitBoltAccessory.prototype.getState = function (callback) {
  var that = this;
  this.log('Getting state');
  this.get('getState', function(state) {
    that.log('Got state: ', state);
    callback(null, state);
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
    that.log('Got hue: ', that.color.hue());
    callback(null, that.color.hue());
  });
};

MisfitBoltAccessory.prototype.setSaturation = function (saturation, callback) {
  var that = this;
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
    that.log('Got saturation: ', that.color.saturation());
    callback(null, that.color.saturation());
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
    that.log('Got brightness: ', that.brightness);
    callback(null, that.brightness);
  });
};
