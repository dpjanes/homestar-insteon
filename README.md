# homestar-insteon
[IOTDB](https://github.com/dpjanes/node-iotdb) Bridge for [Insteon]().

<img src="https://raw.githubusercontent.com/dpjanes/iotdb-homestar/master/docs/HomeStar.png" align="right" />

NOT FINISHED

# Installation

* [Read this first](https://github.com/dpjanes/node-iotdb/blob/master/docs/install.md)

Then:

    $ npm install homestar-insteon

# Testing

## IOTDB

Turn on Insteon.

	$ node
	>>> iotdb = require('iotdb')
	>>> things = iotdb.connect("Insteon")
	>>> things.set(":on", true);
	
## [IoTQL](https://github.com/dpjanes/iotdb-iotql)

Change to HDMI1 

	$ homestar install iotql
	$ homestar iotql
	> SET state:on = true WHERE meta:model-id = "insteon";

## Home☆Star

Do:

	$ homestar runner browser=1
	
You may have to refresh the page, as it may take a little while for your Things to be discovered. If your TV is not on it won't show up.

# Models
## Insteon

See [Insteon.iotql](https://github.com/dpjanes/homestar-insteon/blob/master/models/Insteon.iotql)
