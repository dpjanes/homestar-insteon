# homestar-insteon
[IOTDB](https://github.com/dpjanes/node-iotdb) Bridge for [Insteon]().

<img src="https://raw.githubusercontent.com/dpjanes/iotdb-homestar/master/docs/HomeStar.png" align="right" />

NOT FINISHED

# Installation

* [Read this first](https://github.com/dpjanes/node-iotdb/blob/master/docs/install.md)

Then:

    $ npm install homestar-insteon

# Use

Turn on something

	const iotdb = require('iotdb')
    iotdb.use("homestar-insteon")

	const things = iotdb.connect("InsteonSomething")
	things.set(":on", true);
	
# Models
## Insteon

See [Insteon.iotql](https://github.com/dpjanes/homestar-insteon/blob/master/models/Insteon.iotql)
