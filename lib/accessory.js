var app = require('../package').name,
    debug = require('debug')(app),
    error = require('debug')(app + ':error'),
    timeout = require('debug')(app + ':timeout');

var _ = require('lodash'),
    Color = require('color');

var Service, Characteristic, timer;

module.exports = function (hap) {
  Service = hap.Service;
  Characteristic = hap.Characteristic;
  return MisfitBoltAccessory;
};

function MisfitBoltAccessory(bolt, config, log) {
  this.bolt = bolt;
  this.name = config.name;
  this.log = log;

  // Local state
  this.color = undefined;
  this.brightness = undefined;
  this.state = undefined;

  this.disconnectTimeout = config.disconnectTimeout || 10000;

  timer = function (timedOut) {
    setTimeout(function() {
      timedOut = true;
    }, config.timeout || 1000);
  };

}

MisfitBoltAccessory.prototype.getServices = function () {
  var service = new Service.Lightbulb(this.name),
      that = this;

  function bind(method) {
    return _.bind(that[method], that);
  }

  function attach(characteristic, property) {
    var property = property[0].toUpperCase() + property.slice(1);
    service.getCharacteristic(characteristic)
      .on('set', bind('set' + property))
      .on('get', bind('get' + property))
  }

  attach(Characteristic.On, 'state');
  attach(Characteristic.Hue, 'hue');
  attach(Characteristic.Saturation, 'saturation');
  attach(Characteristic.Brightness, 'brightness');

  return [service];
};

MisfitBoltAccessory.prototype.initialize = function(callback) {
  var that = this;
  this.pull(function(err, settings) {
    if (err) {
      error(err);
      return callback(err);
    }
    that.color = new Color(`rgba(${settings.rgba})`);
    that.brightness = settings.rgba[settings.rgba.length - 1];
    that.state = settings.state;
    that.rgbaToSet = undefined;

    that.log('Initial color', that.color);
    that.log('Initial brightness', that.brightness);
    that.log('Initial state', that.state);

    that.sync();

    callback();
  });
};

MisfitBoltAccessory.prototype.disconnect = function() {
  var bolt = this.bolt;
  clearTimeout(this.willDisconnect);
  this.willDisconnect = setTimeout(function() {
    debug('disconnecting')
    bolt.disconnect(function() {
      debug('disconnected')
    });
  }, this.disconnectTimeout);
};

MisfitBoltAccessory.prototype.sync = function() {
  var that = this,
      bolt = this.bolt,
      timedOut = false;

  timer(timedOut);

  function done () {
    setTimeout(function(){
      that.sync();
    }, 1);
  }

  if (that.rgbaToSet) {
    clearTimeout(this.willDisconnect);
    debug('will sync');
    bolt.connect(function(err) {
      if (timedOut) {
        timeout('bolt.connect');
        return done();
      }
      if (err) {
        error('bolt.connect', err);
        return done();
      }
      debug('setting light');

      // don't wait until light is set before clearing value to set
      // it might get updated before light is set, and we'd miss an update
      var rgbaToSet = that.rgbaToSet;
      that.rgbaToSet = undefined;
      bolt.setRGBA(rgbaToSet, function(err) {
        if (timedOut) {
          timeout('bolt.setRGBA');
        } else if (err) {
          error('bolt.setRGBA', err);
        } else {
          debug('light set');
        }
        that.disconnect();
        done();
      });
    });
  } else {
    done();
  }
};

MisfitBoltAccessory.prototype.pull = function(callback) {
  var bolt = this.bolt,
      timedOut = false;

  timer(timedOut);

  bolt.connect(function(err) {
    if (timedOut) {
      timeout('bolt.connect');
    } else if (err) {
      error('bolt.connect', err);
      return callback(err);
    }
    bolt.getRGBA(function(err, rgba) {
      if (timedOut) {
        timeout('bolt.getRGBA');
      } else if (err) {
        error('bolt.getRGBA', err);
        return callback(err);
      }
      bolt.getState(function(err, state) {
        if (timedOut) {
          timeout('bolt.getState');
        } else if (err) {
          error('bolt.getState', err);
          return callback(err);
        }
        callback(null, {rgba: rgba, state: state})
      });
    });
  });
};

MisfitBoltAccessory.prototype.push = function(callback) {
  var rgb = this.color.rgb();
  this.rgbaToSet = [rgb.r, rgb.g, rgb.b, this.state ? this.brightness : 0];
  debug('setting rgba: ', this.rgbaToSet);
  callback();
};

MisfitBoltAccessory.prototype.setState = function (state, callback) {
  this.log('setting state: ', state);
  this.state = state;
  this.push(callback);
};

MisfitBoltAccessory.prototype.getState = function (callback) {
  this.log('getting state: ', this.state);
  callback(null, this.state);
};

MisfitBoltAccessory.prototype.setHue = function (hue, callback) {
  this.log('setting hue: ', hue);
  this.color.hue(hue);
  this.push(callback);
};

MisfitBoltAccessory.prototype.getHue = function (callback) {
  this.log('getting hue: ', this.color.hue());
  callback(null, this.color.hue());
};

MisfitBoltAccessory.prototype.setSaturation = function (saturation, callback) {
  this.log('setting saturation: ', saturation);
  this.color.saturationv(saturation);
  this.push(callback);
};

MisfitBoltAccessory.prototype.getSaturation = function (callback) {
  this.log('getting saturation: ', this.color.saturation());
  callback(null, this.color.saturation());
};

MisfitBoltAccessory.prototype.setBrightness = function (brightness, callback) {
  this.log('setting brightness: ', brightness);
  this.brightness = brightness;
  this.state = this.brightness > 0;
  this.push(callback);
};

MisfitBoltAccessory.prototype.getBrightness = function (callback) {
  var brightness = this.state > 0 ? this.brightness : 0;
  this.log('getting brightness: ', brightness);
  callback(null, brightness);
};
