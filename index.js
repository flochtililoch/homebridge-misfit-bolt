"use strict";

module.exports = function (homebridge) {
  homebridge.registerPlatform(
    "homebridge-misfit-bolt",
    "MisfitBolt",
    require('./lib/platform')(homebridge.hap)
  );
};
