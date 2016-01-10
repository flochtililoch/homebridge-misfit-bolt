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
  this.ready = false;
  this.color = undefined;
  this.brightness = undefined;
  this.state = undefined;
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

MisfitBoltAccessory.prototype.sync = function(callback) {
  var that = this,
      bolt = this.bolt;

  function done() {
    that.sync();
    if(callback) {
      callback.apply(this, arguments);
    }
  }

  debug('Will sync');

  bolt.connect(function() {
    bolt.getRGBA(function(error, rgba) {
      debug('Got RGBA', rgba);
      var color = new Color(`rgba(${rgba})`),
          brightness = rgba[rgba.length - 1];

      bolt.getState(function(error, state) {

        // local context not set yet? set it
        if (!that.ready) {
          debug('Local context not ready, setting it');
          debug('color:', color);
          debug('brightness:', brightness);
          debug('state:', state);
          that.color = color;
          that.brightness = brightness;
          that.state = state;
          that.ready = true;
          done();

        // local context set but differs from the bulb? update the bulb
        } else {
          var rgb = that.color.rgb(),
              localRGBA = [rgb.r, rgb.g, rgb.b, that.brightness],
              localState = that.state;
          if (state != localState) {
            debug('Local state differs from remote state');
            bolt.setState(localState, done);
          } else if (!_.isEqual(rgba, localRGBA)) {
            debug('Local light differs from remote light');
            bolt.setRGBA(localRGBA, done);
          } else {
            done();
          }
        }

      });

    });
  });
};

MisfitBoltAccessory.prototype.setState = function (state, callback) {
  this.log('Setting state: ', state);
  this.state = state;
  if (this.state !== this.brightness > 0) {
    var brightness = this.state ? 1 : 0;
    this.log('Changing brightness to: ', brightness);
    this.brightness = brightness;
  }
  callback();
};

MisfitBoltAccessory.prototype.getState = function (callback) {
  this.log('Getting state: ', this.state);
  callback(null, this.state);
};

MisfitBoltAccessory.prototype.setHue = function (hue, callback) {
  this.log('Setting hue: ', hue);
  this.color.hue(hue);
  callback();
};

MisfitBoltAccessory.prototype.getHue = function (callback) {
  this.log('Getting hue: ', this.color.hue());
  callback(null, this.color.hue());
};

MisfitBoltAccessory.prototype.setSaturation = function (saturation, callback) {
  this.log('Setting saturation: ', saturation);
  this.color.saturationv(saturation);
  callback();
};

MisfitBoltAccessory.prototype.getSaturation = function (callback) {
  this.log('Getting saturation: ', this.color.saturation());
  callback(null, this.color.saturation());
};

MisfitBoltAccessory.prototype.setBrightness = function (brightness, callback) {
  this.log('Setting brightness: ', brightness);
  this.brightness = brightness;
  var state = this.brightness > 0;
  if (this.state !== state) {
    this.log('Changing state to: ', state);
    this.state = state;
  }
  callback();
};

MisfitBoltAccessory.prototype.getBrightness = function (callback) {
  this.log('Getting brightness: ', this.brightness);
  callback(null, this.brightness);
};
