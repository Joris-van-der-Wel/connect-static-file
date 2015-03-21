'use strict';

var send = require('send');
var accepts = require('accepts');
var mime = require('mime');

module.exports = function connectStaticFile(path, options)
{
        options = {
                encoded: options.encoded,
                headers: {}, // name => value

                // `send` options
                etag: options.etag,
                extensions : options.extensions,
                lastModified: options.lastModified,
                maxAge: options.maxAge,
                index: false,
                dotfiles: 'allow',
                root: path
        };

        return function connectStaticFileMiddleware(request, response, next)
        {
                function onError(err)
                {
                        if (err.code === 'ENOENT')
                        {
                                // file not found, go to the next middleware without error
                                next();
                                return;
                        }

                        next(err);
                }

                function onDirectory()
                {
                        next();
                }

                function onHeaders(response, path, stat)
                {
                        var headers = options.headers || {};
                        var keys = Object.keys(headers);

                        for (var i = 0; i < keys.length; i++)
                        {
                                var key = keys[i];
                                response.setHeader(key, headers[key]);
                        }

                        if (options.encoded)
                        {
                                response.setHeader('Content-Encoding', options.encoded);
                        }

                        if (!response.getHeader('Content-Type') &&
                            options.encoded)
                        {
                                // foo.css.gz -> foo.css
                                var encodedPath = path;
                                encodedPath = encodedPath.replace(/\.(?:gz|gzip|zlib|bz2|xz)$/i, '');

                                var type = mime.lookup(encodedPath);
                                var charset = mime.charsets.lookup(type);

                                response.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''));
                        }
                }

                if (options.encoded)
                {
                        var accept = accepts(request);

                        var method = accept.encodings([options.encoded]);
                        if (method !== options.encoded)
                        {
                                next();
                                return;
                        }
                }

                send(request, '', options)
                        .on('error', onError)
                        .on('directory', onDirectory)
                        .on('headers', onHeaders)
                        .pipe(response);
        };
};