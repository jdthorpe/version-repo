"use strict";
//TODO: tests for object (json) as well as string reposotories.
//TODO: tests verifying that dependencies are updated and/or deleted with updates / upserts / deletes
//TODO: tests verifying only the latest version can be deleted / updated
//TODO: tests for repo.create(... , {upsert:true}) << future feature >> 
Object.defineProperty(exports, "__esModule", { value: true });
var chai = require("chai");
var Promise = require("bluebird");
var should = chai.should(), expect = chai.expect;
function generate_tests(inst) {
    describe("<General Tests> " + inst.name, function () {
        if (inst.before !== undefined)
            before(inst.before);
        if (inst.after !== undefined)
            after(inst.after);
        if (inst.beforeEach !== undefined)
            beforeEach(inst.beforeEach);
        if (inst.afterEach !== undefined)
            afterEach(inst.afterEach);
        it('GET / (`packages()`) should return an empty list', function () {
            return Promise.resolve(inst.repo.packages())
                .should.eventually.be.instanceof(Array).and.have.property('length', 0);
        });
        it('POST(create) should require a version', function () {
            var request;
            try {
                request = Promise.resolve(inst.repo.create({ name: 'foo' }));
            }
            catch (err) {
                request = Promise.reject(err);
            }
            return request.should.eventually.be.rejectedWith(Error, "missing required value options.version");
        });
        it('POST(create) should create a library', function () {
            return Promise.resolve(inst.repo.create({ name: 'foo', version: 'v1.1.1', value: 'Lorem Ipsum dolor sit amet, ...' }))
                .should.eventually.equal(true);
        });
        it('POST(create) should create a library', function () {
            // FOR TESTING THE READ ONLY BUFFER
            return Promise.resolve(inst.repo.create({ name: 'bar', version: 'v1.1.1', value: 'Lorem Ipsum dolor sit amet, ...' }))
                .should.eventually.equal(true);
        });
        it('versions(name) return an array', function () {
            // FOR TESTING THE READ ONLY BUFFER
            return Promise.resolve(inst.repo.versions('bar')).then(function (x) {
                (typeof x).should.equal('object');
                expect(Array.isArray(x)).to.be.true;
                expect(x.indexOf("1.1.1")).to.not.equal(-1);
                expect(x.length).to.equal(1);
            });
        });
        it('versions() return a dictionary', function () {
            // FOR TESTING THE READ ONLY BUFFER
            return Promise.resolve(inst.repo.versions()).then(function (x) {
                (typeof x).should.equal('object');
                expect(Array.isArray(x)).to.be.false;
                expect(x.hasOwnProperty('foo')).to.be.true;
                x.foo.should.deep.equal(['1.1.1']);
            });
        });
        it('POST(create) should not create a library twice', function () {
            var request;
            try {
                request = Promise.resolve(inst.repo.create({ name: 'foo', version: 'v1.1.1', value: 'Lorem Ipsum dolor sit amet, ...' }));
            }
            catch (err) {
                request = Promise.reject(err);
            }
            return request.should.eventually.be.rejectedWith(Error, "Version (1.1.1) does not exceed the latest version (1.1.1)");
        });
        it('POST(create) should not create a previous version', function () {
            var request;
            try {
                request = Promise.resolve(inst.repo.create({ name: 'foo', version: 'v1.1.0', value: 'Lorem Ipsum dolor sit amet, ...' }));
            }
            catch (err) {
                request = Promise.reject(err);
            }
            return request.should.eventually.be.rejectedWith(Error, "Version (1.1.0) does not exceed the latest version (1.1.1)");
        });
        it('fetchOne() should get the library', function () {
            return Promise.resolve(inst.repo.fetchOne({ name: 'foo', version: 'v1.1.1' }))
                .should.eventually.deep.equal({ name: 'foo', version: '1.1.1', value: 'Lorem Ipsum dolor sit amet, ...' });
        });
        it('POST(create) should create a library with a dependency', function () {
            // FOR TESTING THE READ ONLY BUFFER
            return Promise.resolve(inst.repo.create({ name: 'bar', version: 'v1.1.2', value: 'Lorem Ipsum dolor sit amet, ...', depends: { "foo": "~1.0.0" } }))
                .should.eventually.equal(true);
        });
        it('fetchOne() should get the library', function () {
            return Promise.resolve(inst.repo.fetchOne({ name: 'bar', version: 'v1.1.2' }))
                .should.eventually.deep.equal({ name: 'bar', version: '1.1.2', value: 'Lorem Ipsum dolor sit amet, ...', depends: { "foo": "~1.0.0" } });
        });
        it('fetchOne(...,{novalue:true}) should get the library dependency only ', function () {
            return Promise.resolve(inst.repo.fetchOne({ name: 'bar', version: 'v1.1.2' }, { novalue: true }))
                .should.eventually.deep.equal({ name: 'bar', version: '1.1.2', depends: { "foo": "~1.0.0" } });
        });
        it('`var x = repo.fetchOne(); x.depends = "foo";` should not modify the dependencies in the repo', function () {
            // setup:
            return Promise.resolve(inst.repo.fetchOne({ name: 'bar', version: 'v1.1.2' }))
                .then(function (x) {
                x.depends = { "bar": "1.2.3" };
                return inst.repo.fetchOne({ name: 'bar', version: 'v1.1.2' });
            })
                .should.eventually.deep.equal({ name: 'bar', version: '1.1.2', value: 'Lorem Ipsum dolor sit amet, ...', depends: { "foo": "~1.0.0" } });
        });
        it('`var x = repo.fetchOne(); x.value = "bar";` should not modify the values in the repo', function () {
            return Promise.resolve(inst.repo.fetchOne({ name: 'bar', version: 'v1.1.2' }))
                .then(function (x) {
                // setup:
                x.value = { "bar": "1.2.3" };
                // test:
                return inst.repo.fetchOne({ name: 'bar', version: 'v1.1.2' });
            })
                .should.eventually.deep.equal({ name: 'bar', version: '1.1.2', value: 'Lorem Ipsum dolor sit amet, ...', depends: { "foo": "~1.0.0" } });
        });
        it('PUT(updtate) should require a version', function () {
            var request;
            try {
                request = Promise.resolve(inst.repo.update({ name: 'foo' }));
            }
            catch (err) {
                request = Promise.reject(err);
            }
            return request.should.eventually.be.rejectedWith(Error, "missing required value options.version");
        });
        it('put(updtate) should overwrite the library and dependencies', function () {
            return Promise.resolve(inst.repo.update({ name: 'foo', version: 'v1.1.1', value: 'hi there', depends: { "bat": "~1.4.7" } }))
                .should.eventually.equal(true);
        });
        it('GET(fetch) should get the updated library and dependencies', function () {
            return Promise.resolve(inst.repo.fetchOne({ name: 'foo', version: 'v1.1.1' }))
                .should.eventually.deep.equal({ name: 'foo', version: '1.1.1', value: 'hi there', depends: { "bat": "~1.4.7" } });
        });
        it('GET(fetch) should not require the version number', function () {
            return Promise.resolve(inst.repo.fetchOne({ name: 'foo' }))
                .should.eventually.deep.equal({ name: 'foo', version: '1.1.1', value: 'hi there', depends: { "bat": "~1.4.7" } });
        });
        it('put(updtate) should overwrite the library and dependencies', function () {
            return Promise.resolve(inst.repo.update({ name: 'foo', version: 'v1.1.1', value: 'Hi World!' }))
                .should.eventually.equal(true);
        });
        it('GET(fetch) should not require the version number (AGAIN)', function () {
            return Promise.resolve(inst.repo.fetchOne({ name: 'foo' }))
                .should.eventually.deep.equal({ name: 'foo', version: '1.1.1', value: 'Hi World!' });
        });
        it('GET "/" (`packages()`) should return the list of libraries', function () {
            return Promise.resolve(inst.repo.packages()).then(function (x) { return x.sort(); })
                .should.eventually.be.instanceof(Array).and.deep.equal(['foo', 'bar'].sort());
        });
        it('DELETE /foo should require a version.', function () {
            var request;
            try {
                request = Promise.resolve(inst.repo.del({ name: 'foo' }));
            }
            catch (err) {
                request = Promise.reject(err);
            }
            return request.should.eventually.be.rejectedWith(Error, "missing required value options.version");
        });
        it('DELETE /foo not fail', function () {
            return Promise.resolve(inst.repo.del({ name: 'foo', version: '1.1.1' }))
                .should.eventually.to.be.true;
        });
        it('GET "/" (`packages()`) should return the list of libraries', function () {
            return Promise.resolve(inst.repo.packages())
                .should.eventually.be.instanceof(Array).and.deep.equal(['bar']);
        });
    });
}
exports.generate_tests = generate_tests;
//# sourceMappingURL=general-repo-test-fixture.js.map