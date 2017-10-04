'use strict';
const {describe, beforeEach, it, afterEach} = require('mocha-sugar-free');
const path = require('path');
const chai = require('chai');
const chaiHttp = require('chai-http');
const express = require('express');

const staticFile = require('..');

const {expect} = chai;
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

    it('no options given', async () => {
        app.use('/foo', staticFile(path.resolve(__dirname, 'fixtures', 'foo.jpg')));

        const response = await chai.request(app).get('/foo');
        expect(response).to.have.status(200);
        expect(response).to.have.header('content-type', 'image/jpeg');
        expect(response).to.have.header('content-length', '282803');
        expect(response).to.have.header('etag');
        expect(response).to.have.header('last-modified');
        expect(response).to.not.have.header('content-encoding');
    });

    it('empty options given', async () => {
        app.use('/foo', staticFile(path.resolve(__dirname, 'fixtures', 'foo.jpg'), {}));

        const response = await chai.request(app).get('/foo');
        expect(response).to.have.status(200);
        expect(response).to.have.header('content-type', 'image/jpeg');
        expect(response).to.have.header('content-length', '282803');
        expect(response).to.have.header('etag');
        expect(response).to.have.header('last-modified');
        expect(response).to.not.have.header('content-encoding');
    });

    it('disable default options', async () => {
        app.use('/foo', staticFile(
            path.resolve(__dirname, 'fixtures', 'foo.jpg'),
            {etag: false, lastModified: false}
        ));

        const response = await chai.request(app).get('/foo');
        expect(response).to.have.status(200);
        expect(response).to.have.header('content-type', 'image/jpeg');
        expect(response).to.have.header('content-length', '282803');
        expect(response).to.not.have.header('etag');
        expect(response).to.not.have.header('last-modified');
        expect(response).to.not.have.header('content-encoding');
    });

    it('custom headers', async () => {
        app.use('/foo', staticFile(
            path.resolve(__dirname, 'fixtures', 'foo.jpg'),
            {
                headers: {
                    'X-Foo': 'bar',
                    'X-Bar': 'baz quux',
                    'Content-Type': 'text/html',
                },
            }
        ));

        const response = await chai.request(app).get('/foo');
        expect(response).to.have.status(200);
        expect(response).to.have.header('content-type', 'text/html');
        expect(response).to.have.header('content-length', '282803');
        expect(response).to.have.header('etag');
        expect(response).to.have.header('last-modified');
        expect(response).to.not.have.header('content-encoding');
        expect(response).to.have.header('x-foo', 'bar');
        expect(response).to.have.header('x-bar', 'baz quux');
    });

    it('gzip encoding (without mime module charset)', async () => {
        app.use('/foo', staticFile(
            path.resolve(__dirname, 'fixtures', 'foo.jpg.gz'),
            {encoded: 'gzip'}
        ));

        const response = await chai.request(app).get('/foo');
        expect(response).to.have.status(200);
        expect(response).to.have.header('content-type', 'image/jpeg');
        expect(response).to.have.header('content-length', '282281');
        expect(response).to.have.header('etag');
        expect(response).to.have.header('last-modified');
        expect(response).to.have.header('content-encoding', 'gzip');
    });

    it('gzip encoding (with mime module charset)', async () => {
        app.use('/foo', staticFile(
            path.resolve(__dirname, 'fixtures', 'foo.txt.gz'),
            {encoded: 'gzip'}
        ));

        const response = await chai.request(app).get('/foo');
        expect(response).to.have.status(200);
        expect(response).to.have.header('content-type', 'text/plain; charset=UTF-8');
        expect(response).to.have.header('content-length', '4565');
        expect(response).to.have.header('etag');
        expect(response).to.have.header('last-modified');
        expect(response).to.have.header('content-encoding', 'gzip');
    });

    it('gzip file without encoding', async () => {
        app.use('/foo', staticFile(
            path.resolve(__dirname, 'fixtures', 'foo.txt.gz')
        ));

        const response = await chai.request(app).get('/foo');
        expect(response).to.have.status(200);
        expect(response).to.have.header('content-type', 'application/gzip');
        expect(response).to.have.header('content-length', '4565');
        expect(response).to.have.header('etag');
        expect(response).to.have.header('last-modified');
        expect(response).to.not.have.header('content-encoding');
    });

    it('gzip encoding without client support (404)', async () => {
        app.use('/foo', staticFile(
            path.resolve(__dirname, 'fixtures', 'foo.txt.gz'),
            {encoded: 'gzip'}
        ));

        const response = await chai.request(app).get('/foo').set('Accept-Encoding', '');

        // if no route matches, express sends a 404
        expect(response).to.have.status(404);
        expect(response).to.not.have.header('content-encoding', 'gzip');
    });

    it('gzip encoding without client support (match next route)', async () => {
        app.use('/foo', staticFile(
            path.resolve(__dirname, 'fixtures', 'foo.jpg.gz'),
            {encoded: 'gzip'}
        ));

        app.use('/foo',
            staticFile(path.resolve(__dirname, 'fixtures', 'foo.jpg'), {}));

        const response = await chai.request(app).get('/foo').set('Accept-Encoding', '');
        expect(response).to.have.status(200);
        expect(response).to.have.header('content-type', 'image/jpeg');
        expect(response).to.have.header('content-length', '282803');
        expect(response).to.have.header('etag');
        expect(response).to.have.header('last-modified');
        expect(response).to.not.have.header('content-encoding');
    });

    it('file that does not exist', async () => {
        app.use('/foo', staticFile(
            path.resolve(__dirname, 'fixtures', 'doesnotexist.jpg')
        ));

        const response = await chai.request(app).get('/foo');
        expect(response).to.have.status(404);
        expect(response).to.not.have.header('content-encoding', 'gzip');
    });

    it('file that does not exist with encoded set', async () => {
        app.use('/foo', staticFile(
            path.resolve(__dirname, 'fixtures', 'doesnotexist.jpg'),
            {encoded: 'gzip'}
        ));

        const response = await chai.request(app).get('/foo');
        expect(response).to.have.status(404);
        expect(response).to.not.have.header('content-encoding', 'gzip');
    });

    it('file that does not exist (match next route)', async () => {
        app.use('/foo', staticFile(
            path.resolve(__dirname, 'fixtures', 'doesnotexist.jpg')
        ));

        app.use('/foo',
            staticFile(path.resolve(__dirname, 'fixtures', 'foo.jpg')));

        const response = await chai.request(app).get('/foo').set('Accept-Encoding', '');
        expect(response).to.have.status(200);
        expect(response).to.have.header('content-type', 'image/jpeg');
        expect(response).to.have.header('content-length', '282803');
        expect(response).to.have.header('etag');
        expect(response).to.have.header('last-modified');
        expect(response).to.not.have.header('content-encoding');
    });

    it('path that is a directory', async () => {
        app.use('/foo', staticFile(
            path.resolve(__dirname, 'fixtures')
        ));

        const response = await chai.request(app).get('/foo').set('Accept-Encoding', '');

        // if no route matches, express sends a 404
        expect(response).to.have.status(404);
        expect(response).to.not.have.header('content-encoding', 'gzip');
    });
});
