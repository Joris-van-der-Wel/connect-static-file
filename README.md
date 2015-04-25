connect-static-file
===================
Connect/express middleware to serve a single static file

Usage
-----
```javascript
var express = require('express');
var staticFile = require('connect-static-file');

var app = express();
var path = 'path/to/file.txt';
var options = {};
app.use('/foo.txt', staticFile(path, options));
```

### Options

#### etag

Enable or disable etag generation, defaults to true.

#### extensions

If a given file doesn't exist, try appending one of the given extensions,
in the given order. By default, this is disabled (set to `false`). An
example value that will serve extension-less HTML files: `['html', 'htm']`.
This is skipped if the requested file already has an extension.

#### lastModified

Enable or disable `Last-Modified` header, defaults to true. Uses the file
system's last modified value.

#### maxAge

Provide a max-age in milliseconds for http caching, defaults to 0.
This can also be a string accepted by the
[ms](https://www.npmjs.org/package/ms#readme) module.

#### headers

Any additional headers you would like to set on the response. This is a plain old javascript object: `headers: {'X-Foo': 'bar'}`

#### encoded

If set, assume the static file has been encoded using the specified encoding. For example `encoded: 'gzip'`. This value must be a valid `Content-Encoding` [token](https://www.iana.org/assignments/http-parameters/http-parameters.xhtml#content-coding).
If the browser does not support this encoding _(the encoding is not specified in the `Accept-Encoding` request header)_, this middleware will pass on the request to the next middleware. The `Content-Encoding` header will be set so that the browser will uncompress the file on the fly.

This is useful if you are compressing your static files beforehand:

```javascript
app.use('/bundle.js', staticFile('generated/bundle.js.gz', {encoded: 'gzip'}));
// If the file is missing, or if the browser does not support gzip, use this one instead:
app.use('/bundle.js', staticFile('generated/bundle.js'));
```

Other modules
-------------
If you would like to server an entire directory of possible gziped files, take a look at [connect-gzip-static](https://www.npmjs.com/package/connect-gzip-static) or [ecstatic](https://www.npmjs.com/package/ecstatic). If you would like dynamic gzip compression, try [compression](https://www.npmjs.com/package/compression)