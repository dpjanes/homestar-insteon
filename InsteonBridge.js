/*
 *  InsteonBridge.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-02-01
 *
 *  Copyright [2013-2016] [David P. Janes]
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

"use strict";

var iotdb = require('iotdb');
var _ = iotdb._;

var InsteonAPI = require('insteon-api');

var logger = iotdb.logger({
    name: 'homestar-insteon',
    module: 'InsteonBridge',
});

/**
 *  See {iotdb.bridge.Bridge#Bridge} for documentation.
 *  <p>
 *  @param {object|undefined} native
 *  only used for instances, should be 
 */
var InsteonBridge = function (initd, native) {
    var self = this;

    self.initd = _.defaults(initd,
        iotdb.keystore().get("bridges/InsteonBridge/initd"), {
            key: null,
            secret: null,
            poll: 30
        }
    );

    if (!self.initd.key) {
        throw new Error("InsteonBridge: expected a key or bridges/InsteonBridge/initd/key");
    }
    if (!self.initd.secret) {
        throw new Error("InsteonBridge: expected a secret or bridges/InsteonBridge/initd/secret");
    }

    self.native = native;   // the thing that does the work - keep this name

    if (self.native) {
        self.queue = _.queue("InsteonBridge");
    }
};

InsteonBridge.prototype = new iotdb.Bridge();

InsteonBridge.prototype.name = function () {
    return "InsteonBridge";
};

/* --- lifecycle --- */

/**
 *  See {iotdb.bridge.Bridge#discover} for documentation.
 */
InsteonBridge.prototype.discover = function () {
    var self = this;

    logger.info({
        method: "discover"
    }, "called");

    /*
     *  This is the core bit of discovery. As you find new
     *  thimgs, make a new InsteonBridge and call 'discovered'.
     *  The first argument should be self.initd, the second
     *  the thing that you do work with
     */
    var s = self._insteon();
    s.on('something', function (native) {
        self.discovered(new InsteonBridge(self.initd, native));
    });
};

/**
 *  See {iotdb.bridge.Bridge#connect} for documentation.
 */
InsteonBridge.prototype.connect = function (connectd) {
    var self = this;
    if (!self.native) {
        return;
    }

    self._validate_connect(connectd);

    /**
     *  TD: need to make a version that if an error is returned
     *  it will try again in 30 seconds or whatever
     */
    self._insteon(function(error, native) {
        if (error) {
            logger.error({
                error: _.error.message(error),
            }, "could not connect to Insteon API");
            return;
        }
    });
    
};

InsteonBridge.prototype._setup_polling = function () {
    var self = this;
    if (!self.initd.poll) {
        return;
    }

    var timer = setInterval(function () {
        if (!self.native) {
            clearInterval(timer);
            return;
        }

        self.pull();
    }, self.initd.poll * 1000);
};

InsteonBridge.prototype._forget = function () {
    var self = this;
    if (!self.native) {
        return;
    }

    logger.info({
        method: "_forget"
    }, "called");

    self.native = null;
    self.pulled();
};

/**
 *  See {iotdb.bridge.Bridge#disconnect} for documentation.
 */
InsteonBridge.prototype.disconnect = function () {
    var self = this;
    if (!self.native || !self.native) {
        return;
    }

    self._forget();
};

/* --- data --- */

/**
 *  See {iotdb.bridge.Bridge#push} for documentation.
 */
InsteonBridge.prototype.push = function (pushd, done) {
    var self = this;
    if (!self.native) {
        done(new Error("not connected"));
        return;
    }

    self._validate_push(pushd, done);

    logger.info({
        method: "push",
        pushd: pushd
    }, "push");

    var qitem = {
        // if you set "id", new pushes will unqueue old pushes with the same id
        // id: self.number, 
        run: function () {
            self._pushd(pushd);
            self.queue.finished(qitem);
        },
        coda: function() {
            done();
        },
    };
    self.queue.add(qitem);
};

/**
 *  Do the work of pushing. If you don't need queueing
 *  consider just moving this up into push
 */
InsteonBridge.prototype._push = function (pushd) {
    if (pushd.on !== undefined) {
    }
};

/**
 *  See {iotdb.bridge.Bridge#pull} for documentation.
 */
InsteonBridge.prototype.pull = function () {
    var self = this;
    if (!self.native) {
        return;
    }
};

/* --- state --- */

/**
 *  See {iotdb.bridge.Bridge#meta} for documentation.
 */
InsteonBridge.prototype.meta = function () {
    var self = this;
    if (!self.native) {
        return;
    }

    return {
        "iot:thing-id": _.id.thing_urn.unique("Insteon", self.native.uuid, self.initd.number),
        "schema:name": self.native.name || "Insteon",

        // "iot:thing-number": self.initd.number,
        // "iot:device-id": _.id.thing_urn.unique("Insteon", self.native.uuid),
        // "schema:manufacturer": "",
        // "schema:model": "",
    };
};

/**
 *  See {iotdb.bridge.Bridge#reachable} for documentation.
 */
InsteonBridge.prototype.reachable = function () {
    return this.native !== null;
};

/**
 *  See {iotdb.bridge.Bridge#configure} for documentation.
 */
InsteonBridge.prototype.configure = function (app) {};

/* -- internals -- */
var __singleton;

/**
 *  If you need a singleton to access the library
 */
InsteonBridge.prototype._insteon = function () {
    var self = this;

    if (!__singleton) {
        __singleton = insteon.init();
    }

    return __singleton;
};

/*
 *  API
 */
exports.Bridge = InsteonBridge;

var __insteond = {};
var __pendingsd = {};

/**
 *  This returns a connection object per ( host, port, tunnel_host, tunnel_port )
 *  tuple, ensuring the correct connection object exists and is connected.
 *  It calls back with the connection object
 *
 *  The code is complicated because we have to keep callbacks stored 
 *  in '__pendingsd' until the connection is actually made
 */
InsteonBridge.prototype._insteon = function (callback) {
    var self = this;

    var key = self.initd.key;

    var insteon = __insteond[key];
    if (insteon === undefined) {
        var connect = false;

        var pendings = __pendingsd[key];
        if (pendings === undefined) {
            pendings = [];
            __pendingsd[key] = pendings;
            connect = true;
        }

        pendings.push(callback);

        if (connect) {
            logger.info({
                method: "_insteon",
                npending: pendings.length,
                key: self.initd.key,
            }, "connecting to Insteon");

            insteon = new InsteonAPI({
                key: self.initd.key,
                secret: self.initd.secret,
            });
            insteon.on('error', function(error) {
                __insteond[key] = insteon;

                pendings.map(function (pending) {
                    pending(error, null);
                });

                delete __pendingsd[key];
            });
            insteon.on('connect', function() {
                __insteond[key] = insteon;

                pendings.map(function (pending) {
                    pending(null, insteon);
                });

                delete __pendingsd[key];
            });
        }
    } else {
        callback(null, insteon);
    }
};
