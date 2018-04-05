"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var general_repo_test_fixture_1 = require("./general-repo-test-fixture");
var chai = require("chai");
var should = chai.should(), expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var repo = require("../index");
// ------------------------------------------------------------
// set up the instances to be tested
// ------------------------------------------------------------
general_repo_test_fixture_1.generate_tests({ name: "Memory Repo",
    repo: new repo.MemoryRepo() });
general_repo_test_fixture_1.generate_tests({ name: "Memory Repo with trivial transform",
    repo: new repo.sTransform(new repo.MemoryRepo(), (function (x) { return x; }), (function (x) { return x; })) });
general_repo_test_fixture_1.generate_tests({ name: "Memory Repo with trivial async-transform",
    repo: new repo.dTransform(new repo.MemoryRepo(), (function (x) { return x; }), (function (x) { return x; })) });
//# sourceMappingURL=general-repo-tests.js.map