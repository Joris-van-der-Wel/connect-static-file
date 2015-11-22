'use strict';

const describe = require('mocha-sugar-free').describe;
const it = require('mocha-sugar-free').it;
const beforeEach = require('mocha-sugar-free').beforeEach;
const afterEach = require('mocha-sugar-free').afterEach;
const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const express = require('express');
const staticFile = require('..');

chai.use(chaiHttp);

describe('connect-static-file', () => {
        let app;
        let server;

        beforeEach(() => {
                app = express();
                server = app.listen(0);
        });

        afterEach(() => {
                server.close();
                app = null;
                server = null;
        });

        it('no options given', () => {
                app.use('/foo',
                        staticFile(path.resolve(__dirname, 'fixtures', 'foo.jpg'))
                );

                return chai.request(app)
                .get('/foo')
                .then(response => {
                        expect(response).to.have.status(200);
                        expect(response).to.have.header('content-type', 'image/jpeg');
                        expect(response).to.have.header('content-length', '282803');
                        expect(response).to.have.header('etag');
                        expect(response).to.have.header('last-modified');
                        expect(response).to.not.have.header('content-encoding');
                });
        }, {expectPromise: true});

        it('empty options given', () => {
                app.use('/foo',
                        staticFile(path.resolve(__dirname, 'fixtures', 'foo.jpg'), {})
                );

                return chai.request(app)
                        .get('/foo')
                        .then(response => {
                                expect(response).to.have.status(200);
                                expect(response).to.have.header('content-type', 'image/jpeg');
                                expect(response).to.have.header('content-length', '282803');
                                expect(response).to.have.header('etag');
                                expect(response).to.have.header('last-modified');
                                expect(response).to.not.have.header('content-encoding');
                        });
        }, {expectPromise: true});

        it('disable default options', () => {
                app.use('/foo',
                        staticFile(
                                path.resolve(__dirname, 'fixtures', 'foo.jpg'),
                                {etag: false, lastModified: false}
                        )
                );

                return chai.request(app)
                        .get('/foo')
                        .then(response => {
                                expect(response).to.have.status(200);
                                expect(response).to.have.header('content-type', 'image/jpeg');
                                expect(response).to.have.header('content-length', '282803');
                                expect(response).to.not.have.header('etag');
                                expect(response).to.not.have.header('last-modified');
                                expect(response).to.not.have.header('content-encoding');
                        });
        }, {expectPromise: true});

        it('custom headers', () => {
                app.use('/foo',
                        staticFile(
                                path.resolve(__dirname, 'fixtures', 'foo.jpg'),
                                {
                                        headers: {
                                                'X-Foo': 'bar',
                                                'X-Bar': 'baz quux',
                                                'Content-Type': 'text/html'
                                        }
                                }
                        )
                );

                return chai.request(app)
                        .get('/foo')
                        .then(response => {
                                expect(response).to.have.status(200);
                                expect(response).to.have.header('content-type', 'text/html');
                                expect(response).to.have.header('content-length', '282803');
                                expect(response).to.have.header('etag');
                                expect(response).to.have.header('last-modified');
                                expect(response).to.not.have.header('content-encoding');
                                expect(response).to.have.header('x-foo', 'bar');
                                expect(response).to.have.header('x-bar', 'baz quux');
                        });
        }, {expectPromise: true});

        it('gzip encoding (without mime module charset)', () => {
                app.use('/foo',
                        staticFile(
                                path.resolve(__dirname, 'fixtures', 'foo.jpg.gz'),
                                {encoded: 'gzip'}
                        )
                );

                return chai.request(app)
                        .get('/foo')
                        .then(response => {
                                expect(response).to.have.status(200);
                                expect(response).to.have.header('content-type', 'image/jpeg');
                                expect(response).to.have.header('content-length', '282281');
                                expect(response).to.have.header('etag');
                                expect(response).to.have.header('last-modified');
                                expect(response).to.have.header('content-encoding', 'gzip');
                        });
        }, {expectPromise: true});

        it('gzip encoding (with mime module charset)', () => {
                app.use('/foo',
                        staticFile(
                                path.resolve(__dirname, 'fixtures', 'foo.txt.gz'),
                                {encoded: 'gzip'}
                        )
                );

                return chai.request(app)
                        .get('/foo')
                        .then(response => {
                                expect(response).to.have.status(200);
                                expect(response).to.have.header('content-type', 'text/plain; charset=UTF-8');
                                expect(response).to.have.header('content-length', '4565');
                                expect(response).to.have.header('etag');
                                expect(response).to.have.header('last-modified');
                                expect(response).to.have.header('content-encoding', 'gzip');
                        });
        }, {expectPromise: true});

        it('gzip file without encoding', () => {
                app.use('/foo',
                        staticFile(
                                path.resolve(__dirname, 'fixtures', 'foo.txt.gz')
                        )
                );

                return chai.request(app)
                        .get('/foo')
                        .then(response => {
                                expect(response).to.have.status(200);
                                expect(response).to.have.header('content-type', 'application/octet-stream');
                                expect(response).to.have.header('content-length', '4565');
                                expect(response).to.have.header('etag');
                                expect(response).to.have.header('last-modified');
                                expect(response).to.not.have.header('content-encoding');
                        });
        }, {expectPromise: true});

        it('gzip encoding without client support (404)', () => {
                app.use('/foo',
                        staticFile(
                                path.resolve(__dirname, 'fixtures', 'foo.txt.gz'),
                                {encoded: 'gzip'}
                        )
                );

                return chai.request(app)
                        .get('/foo')
                        .set('Accept-Encoding', '')
                        .then(response => {
                                // if no route matches, express sends a 404
                                expect(response).to.have.status(404);
                                expect(response).to.not.have.header('content-encoding', 'gzip');
                        });
        }, {expectPromise: true});

        it('gzip encoding without client support (match next route)', () => {
                app.use('/foo',
                        staticFile(
                                path.resolve(__dirname, 'fixtures', 'foo.jpg.gz'),
                                {encoded: 'gzip'}
                        )
                );

                app.use('/foo',
                        staticFile(path.resolve(__dirname, 'fixtures', 'foo.jpg'), {})
                );

                return chai.request(app)
                        .get('/foo')
                        .set('Accept-Encoding', '')
                        .then(response => {
                                expect(response).to.have.status(200);
                                expect(response).to.have.header('content-type', 'image/jpeg');
                                expect(response).to.have.header('content-length', '282803');
                                expect(response).to.have.header('etag');
                                expect(response).to.have.header('last-modified');
                                expect(response).to.not.have.header('content-encoding');
                        });
        }, {expectPromise: true});

        it('file that does not exist', () => {
                app.use('/foo',
                        staticFile(path.resolve(__dirname, 'fixtures', 'doesnotexist.jpg'))
                );

                return chai.request(app)
                        .get('/foo')
                        .then(response => {
                                expect(response).to.have.status(404);
                                expect(response).to.not.have.header('content-encoding', 'gzip');
                        });
        });

        it('file that does not exist with encoded set', () => {
                app.use('/foo',
                        staticFile(
                                path.resolve(__dirname, 'fixtures', 'doesnotexist.jpg'),
                                {encoded: 'gzip'}
                        )
                );

                return chai.request(app)
                        .get('/foo')
                        .then(response => {
                                expect(response).to.have.status(404);
                                expect(response).to.not.have.header('content-encoding', 'gzip');
                        });
        });

        it('file that does not exist (match next route)', () => {
                app.use('/foo',
                        staticFile(
                                path.resolve(__dirname, 'fixtures', 'doesnotexist.jpg')
                        )
                );

                app.use('/foo',
                        staticFile(path.resolve(__dirname, 'fixtures', 'foo.jpg'))
                );

                return chai.request(app)
                        .get('/foo')
                        .set('Accept-Encoding', '')
                        .then(response => {
                                expect(response).to.have.status(200);
                                expect(response).to.have.header('content-type', 'image/jpeg');
                                expect(response).to.have.header('content-length', '282803');
                                expect(response).to.have.header('etag');
                                expect(response).to.have.header('last-modified');
                                expect(response).to.not.have.header('content-encoding');
                        });
        });

        it('path that is a directory', () => {
                app.use('/foo',
                        staticFile(
                                path.resolve(__dirname, 'fixtures')
                        )
                );

                return chai.request(app)
                        .get('/foo')
                        .set('Accept-Encoding', '')
                        .then(response => {
                                // if no route matches, express sends a 404
                                expect(response).to.have.status(404);
                                expect(response).to.not.have.header('content-encoding', 'gzip');
                        });
        });
});
