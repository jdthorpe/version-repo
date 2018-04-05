"use strict";
exports.__esModule = true;
var backend_test_fixture_1 = require("./backend-test-fixture");
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
var expect = chai.expect;
var repo = require("../index");
//--------------------------------------------------
// just making sure teh fixture works as expected
//--------------------------------------------------
backend_test_fixture_1.generate_backend_tests({
    name: "Memory Repo",
    repo: new repo.MemoryRepo()
});
//--------------------------------------------------
// backends populated via the fronend
//--------------------------------------------------
backend_test_fixture_1.generate_backend_tests({
    name: "Memory Repo with trivial transform",
    repo: new repo.sTransform(new repo.MemoryRepo(), (function (x) { return x; }), (function (x) { return x; }))
});
backend_test_fixture_1.generate_backend_tests({
    name: "Memory Repo with trivial async-transform",
    repo: new repo.dTransform(new repo.MemoryRepo(), (function (x) { return x; }), (function (x) { return x; }))
});
//--------------------------------------------------
// backends populated directly 
//--------------------------------------------------
(function () {
    var _backend = new repo.MemoryRepo();
    backend_test_fixture_1.generate_backend_tests({
        name: "Memory Repo with trivial async-transform",
        backend: _backend,
        repo: new repo.dTransform(_backend, (function (x) { return x; }), (function (x) { return x; }))
    });
})();
(function () {
    var _backend = new repo.MemoryRepo();
    backend_test_fixture_1.generate_backend_tests({
        name: "Memory Repo with trivial async-transform and buffer",
        backend: _backend,
        repo: new repo.ReadonlyBuffer(new repo.dTransform(_backend, (function (x) { return x; }), (function (x) { return x; })))
    });
})();
