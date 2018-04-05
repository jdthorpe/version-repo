import { generate_tests } from "./general-repo-test-fixture"
import { sync_repository, deferred_repository, resource_data } from   "../src/typings";

import chai = require('chai');
const should = chai.should(),
      expect = chai.expect;
import chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

import repo = require('../index');
import * as Promise from "bluebird"

// ------------------------------------------------------------
// set up the instances to be tested
// ------------------------------------------------------------

generate_tests({name: "Memory Repo", 
                repo: new repo.MemoryRepo()});
generate_tests({name: "Memory Repo with trivial transform", 
                repo: new repo.sTransform(new repo.MemoryRepo(), (x => x), (x => x))});
generate_tests({name: "Memory Repo with trivial async-transform", 
                repo: new repo.dTransform(new repo.MemoryRepo(), (x => x), (x => x))});
