'use strict';
const send = require('send');
const accepts = require('accepts');
const mime = require('mime');

const connectStaticFile = (path, options = {}) => {
    const sendOptions = {
        acceptRanges: options.acceptRanges,
        cacheControl: options.cacheControl,
        dotfiles: 'allow',
        etag: options.etag,
        extensions: options.extensions,
        immutable: options.immutable,
        index: false,
        lastModified: options.lastModified,
        maxAge: options.maxAge,
        root: path,
    };

    const {encoded} = options;
    const headers = [];

    if (options.headers) {
        Object.keys(options.headers).forEach((name) => {
            headers.push({
                name: name,
                value: options.headers[name],
            });
        });
    }

    const connectStaticFileMiddleware = (request, response, next) => {
        const onError = (err) => {
            if (err.code === 'ENOENT') {
                // file not found, go to the next middleware without error
                next();

                return;
            }

            next(err);
        };

        const onDirectory = () => {
            next();
        };

        const onHeaders = (response, path, stat) => {
            for (let i = 0; i < headers.length; i++) {
                response.setHeader(headers[i].name, headers[i].value);
            }

            if (encoded) {
                response.setHeader('Content-Encoding', encoded);
            }

            if (!response.getHeader('Content-Type') && encoded) {
                // foo.css.gz -> foo.css
                let encodedPath = path;
                encodedPath = encodedPath.replace(/\.(?:gz|gzip|zlib|bz2|xz)$/i, '');

                const type = mime.lookup(encodedPath);
                const charset = mime.charsets.lookup(type);
                response.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''));
            }
        };

        if (encoded) {
            const accept = accepts(request);
            const method = accept.encodings([encoded]);

            if (method !== encoded) {
                next();
                return;
            }
        }

        send(request, '', sendOptions)
        .on('error', onError)
        .on('directory', onDirectory)
        .on('headers', onHeaders)
        .pipe(response);
    };

    return connectStaticFileMiddleware;
};

module.exports = connectStaticFile;
