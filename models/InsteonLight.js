/*
 *  Insteon.js
 *
 *  David Janes
 *  IOTDB
 *  2016-02-01
 */

var iotdb = require("iotdb");

exports.binding = {
    bridge: require('../InsteonBridge').Bridge,
    model: require('./insteon-light.json'),
};
