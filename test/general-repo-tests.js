"use strict";
exports.__esModule = true;
var chai = require("chai");
var should = chai.should(), expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var repo = require("../index");
var Promise = require("bluebird");
// ------------------------------------------------------------
// set up the instances to be tested
// ------------------------------------------------------------
var instances = [];
instances.push({ name: "Memory Repo",
    repo: new repo.MemoryRepo() });
instances.push({ name: "Memory Repo with trivial transform",
    repo: new repo.sTransform(new repo.MemoryRepo(), (function (x) { return x; }), (function (x) { return x; })) });
instances.push({ name: "Memory Repo with trivial async-transform",
    repo: new repo.dTransform(new repo.MemoryRepo(), (function (x) { return x; }), (function (x) { return x; })) });
// ------------------------------------------------------------
// ------------------------------------------------------------
instances.map(function (inst) {
    var repo = inst.repo;
    describe(inst.name, function () {
        it('GET / (`packages()`) should return an empty list', function () {
            Promise.resolve(repo.packages())
                .should.eventually.be["instanceof"](Array).and.have.property('length', 0);
        });
        it('POST(create) should require a version', function () {
            var request;
            try {
                request = Promise.resolve(repo.create({ name: 'foo' }));
            }
            catch (err) {
                request = Promise.reject(err);
            }
            request.should.eventually.be.rejectedWith(Error, "missing required value options.version");
        });
        it('POST(create) should create a library', function () {
            Promise.resolve(repo.create({ name: 'foo', version: 'v1.1.1', value: 'My favorite equations' }))
                .should.eventually.equal(true);
        });
        it('POST(create) should create a library', function () {
            // FOR TESTING THE READ ONLY BUFFER
            Promise.resolve(repo.create({ name: 'bar', version: 'v1.1.1', value: 'My favorite equations' }))
                .should.eventually.equal(true);
        });
        /*
                it('versions(name) return an array',function() {
                    // FOR TESTING THE READ ONLY BUFFER
                    var x = repo.versions('bar');
                    (typeof x).should.equal('object');
                    expect(Array.isArray(x)).to.be.true;
                    expect(x.indexOf("1.1.1")).to.not.equal(-1);
                    expect(x.length).to.equal(1);
                });
        
        */
        it('versions(name) return an array', function () {
            // FOR TESTING THE READ ONLY BUFFER
            Promise.resolve(repo.versions('bar')).then(function (x) {
                (typeof x).should.eventually.equal('object');
                expect(Array.isArray(x)).to.eventually.be["true"];
                expect(x.indexOf("1.1.1")).to.eventually.not.equal(-1);
                expect(x.length).to.eventually.equal(1);
            });
        });
        /*
                it('versions() return a dictionary',function() {
                    // FOR TESTING THE READ ONLY BUFFER
                    var x = repo.versions();
                    (typeof x).should.equal('object');
                    expect(Array.isArray(x)).to.be.false;
                    expect(x.hasOwnProperty('foo')).to.be.true;
                    x.foo.should.deep.equal(['1.1.1']);
                });
        */
        it('versions() return a dictionary', function () {
            // FOR TESTING THE READ ONLY BUFFER
            Promise.resolve(repo.versions()).then(function (x) {
                (typeof x).should.eventually.equal('object');
                expect(Array.isArray(x)).to.eventually.be["false"];
                expect(x.hasOwnProperty('foo')).to.eventually.be["true"];
                x.foo.should.eventually.deep.equal(['1.1.1']);
            });
        });
        it('POST(create) should not create a library twice', function () {
            var request;
            try {
                request = Promise.resolve(repo.create({ name: 'foo', version: 'v1.1.1', value: 'My favorite equations' }));
            }
            catch (err) {
                request = Promise.reject(err);
            }
            request.should.eventually.be.rejectedWith(Error, "Version (1.1.1) does not exceed the latest version (1.1.1)");
        });
        it('POST(create) should not create a previous version', function () {
            var request;
            try {
                request = Promise.resolve(repo.create({ name: 'foo', version: 'v1.1.0', value: 'My favorite equations' }));
            }
            catch (err) {
                request = Promise.reject(err);
            }
            request.should.eventually.be.rejectedWith(Error, "Version (1.1.0) does not exceed the latest version (1.1.1)");
        });
        it('fetchOne() should get the library', function () {
            Promise.resolve(repo.fetchOne({ name: 'foo', version: 'v1.1.1' }))
                .should.eventually.deep.equal({ name: 'foo', version: '1.1.1', value: 'My favorite equations' });
        });
        it('POST(create) should create a library with a dependency', function () {
            // FOR TESTING THE READ ONLY BUFFER
            Promise.resolve(repo.create({ name: 'bar', version: 'v1.1.2', value: 'My favorite equations', depends: { "foo": "~1.0.0" } }))
                .should.eventually.equal(true);
        });
        it('fetchOne() should get the library', function () {
            Promise.resolve(repo.fetchOne({ name: 'bar', version: 'v1.1.2' }))
                .should.eventually.deep.equal({ name: 'bar', version: '1.1.2', value: 'My favorite equations', depends: { "foo": "~1.0.0" } });
        });
        it('fetchOne(...,{novalue:treu}) should get the library dependency only ', function () {
            Promise.resolve(repo.fetchOne({ name: 'bar', version: 'v1.1.2' }, { novalue: true }))
                .should.eventually.deep.equal({ name: 'bar', version: '1.1.2', depends: { "foo": "~1.0.0" } });
        });
        it('`var x = repo.fetchOne(); x.depends = "foo";` should not modify the dependencies in the repo', function () {
            // setup:
            Promise.resolve(repo.fetchOne({ name: 'bar', version: 'v1.1.2' }))
                .then(function (x) {
                x.depends = { "bar": "1.2.3" };
                return repo.fetchOne({ name: 'bar', version: 'v1.1.2' });
            })
                .should.eventually.deep.equal({ name: 'bar', version: '1.1.2', value: 'My favorite equations', depends: { "foo": "~1.0.0" } });
        });
        it('`var x = repo.fetchOne(); x.value = "bar";` should not modify the values in the repo', function () {
            Promise.resolve(repo.fetchOne({ name: 'bar', version: 'v1.1.2' }))
                .then(function (x) {
                // setup:
                x.value = { "bar": "1.2.3" };
                // test:
                return repo.fetchOne({ name: 'bar', version: 'v1.1.2' });
            })
                .should.eventually.deep.equal({ name: 'bar', version: '1.1.2', value: 'My favorite equations', depends: { "foo": "~1.0.0" } });
        });
        it('PUT(updtate) should require a version', function () {
            var request;
            try {
                request = Promise.resolve(repo.update({ name: 'foo' }));
            }
            catch (err) {
                request = Promise.reject(err);
            }
            request.should.eventually.be.rejectedWith(Error, "missing required value options.version");
        });
        it('put(updtate) should overwrite the library', function () {
            Promise.resolve(repo.update({ name: 'foo', version: 'v1.1.1', value: 'hi there' }))
                .should.eventually.equal(true);
        });
        it('GET(fetch) should get the new library', function () {
            Promise.resolve(repo.fetchOne({ name: 'foo', version: 'v1.1.1' }))
                .should.eventually.deep.equal({ name: 'foo', version: '1.1.1', value: 'hi there' });
        });
        it('GET(fetch) should not require the version number', function () {
            Promise.resolve(repo.fetchOne({ name: 'foo' }))
                .should.eventually.deep.equal({ name: 'foo', version: '1.1.1', value: 'hi there' });
        });
        it('GET "/" (`packages()`) should return the list of libraries', function () {
            Promise.resolve(repo.packages())
                .should.eventually.be["instanceof"](Array).and.deep.equal(['foo', 'bar']);
        });
        it('DELETE /foo should require a version.', function () {
            var request;
            try {
                request = Promise.resolve(repo.del({ name: 'foo' }));
            }
            catch (err) {
                request = Promise.reject(err);
            }
            request.should.eventually.be.rejectedWith(Error, "missing required value options.version");
        });
        it('DELETE /foo not fail', function () {
            Promise.resolve(repo.del({ name: 'foo', version: '1.1.1' }))
                .should.eventually.to.be["true"];
        });
        it('GET "/" (`packages()`) should return the list of libraries', function () {
            Promise.resolve(repo.packages())
                .should.eventually.be["instanceof"](Array).and.deep.equal(['bar']);
        });
    });
});
