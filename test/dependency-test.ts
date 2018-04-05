import { generate_version_resolution_tests } from "./version-resolution-test-fixture"
import chai = require("chai");
import chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
var expect = chai.expect;
import * as Promise from "bluebird"

import { package_loc,
         sync_repository,
         deferred_repository,
         deferred_readable_repository} from "../src/typings"

import repo = require('../index');

//--------------------------------------------------
// just making sure teh fixture works as expected
//--------------------------------------------------
generate_version_resolution_tests({
    name: "Memory Repo", 
    repo: new repo.MemoryRepo()
});



//--------------------------------------------------
// backends populated via the fronend
//--------------------------------------------------
generate_version_resolution_tests({
    name: "Memory Repo with trivial transform", 
    repo: new repo.sTransform(new repo.MemoryRepo(), (x => x), (x => x))
});
generate_version_resolution_tests({
    name: "Memory Repo with trivial async-transform", 
    repo: new repo.dTransform(new repo.MemoryRepo(), (x => x), (x => x))
});


//--------------------------------------------------
// backends populated directly 
//--------------------------------------------------

(function (){

    const _backend = new repo.MemoryRepo();

    generate_version_resolution_tests({
        name: "Memory Repo with trivial async-transform", 
        backend: _backend,
        repo: new repo.dTransform(_backend, (x => x), (x => x))
    });

})();


(function(){

    const _backend = new repo.MemoryRepo();

    generate_version_resolution_tests({
        name: "Memory Repo with trivial async-transform and buffer", 
        backend: _backend,
        repo: new repo.ReadonlyBuffer(new repo.dTransform(_backend, (x => x), (x => x)))
    });

})();


