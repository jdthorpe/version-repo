
import chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
var expect = chai.expect;

import {MemoryRepo} from "../src/memory_repo";
//-- var Que = require("q");
//-- Que.longStackSupport = true;

import { package_loc, deferred_readable_repository } from "../src/typings"

import * as Promise from "bluebird";


function init_repo():deferred_readable_repository<string>{

    // create the testing repository.
    var repo= new MemoryRepo<string>();
    return Promise.all([
        repo.create({name:"a",version:"1.0.0",value:"1.0.0"}),
        repo.create({name:"a",version:"1.1.1",value:"1.1.1"}),
        repo.create({name:"a",version:"1.1.2",value:"1.1.2"}),
        repo.create({name:"a",version:"1.1.3",value:"1.1.3"}),
        repo.create({name:"a",version:"1.2.3",value:"1.2.3"}),
        repo.create({name:"a",version:"2.0.0",value:"2.0.0"}),
                                                           
        repo.create({name:"b",version:"1.0.0",value:"1.0.0",depends:{"a":"~1.0.0"}}),
        repo.create({name:"b",version:"1.1.1",value:"1.1.1",depends:{"a":"~1.1.1"}}),
        repo.create({name:"b",version:"1.1.3",value:"1.1.3",depends:{"a":"1.1.2"}}),
        repo.create({name:"b",version:"1.1.4",value:"1.1.4",depends:{"a":"~2.0.0"}}),
                                                           
        repo.create({name:"c",version:"1.0.0",value:"1.0.0"}),
        repo.create({name:"c",version:"1.1.1",value:"1.1.1",depends:{"b":"~1.1.1"}}),
        repo.create({name:"c",version:"1.1.2",value:"1.1.2",depends:{"b":"~1.1.2"}}),
        repo.create({name:"c",version:"1.1.3",value:"1.1.3",depends:{"b":"1.1.1","a":"2.0.0"}}),// internally conflicted;
        repo.create({name:"c",version:"1.1.4",value:"1.1.4",depends:{"b":"~1.1.3"}}),
        ]).then(x => repo);

}

describe("repo.version()",function(){
    var __repo__:sync_repository<string>;
    before(function(){
        __repo__ = init_repo()
    })

    it("versoin(name) should return an array",function() {
        expect(Array.isArray(__repo__.versions("a"))).to.be.true;
        expect(Array.isArray(__repo__.versions("b"))).to.be.true;
        expect(Array.isArray(__repo__.versions("c"))).to.be.true;
    });

    it("versoin() should return an dictionary of strings",function() {
        var x = __repo__.versions();
        (typeof x).should.equal("object");
        var keys = Object.keys(x);
        keys.length.should.equal(3);
        expect(keys.indexOf("a")).to.not.equal(-1);
        (typeof x["a"]).should.equal("object");
        expect(Array.isArray(x["a"])).to.be.true;
        expect(Array.isArray(x["b"])).to.be.true;
        expect(Array.isArray(x["c"])).to.be.true;
        expect(x["a"].indexOf("1.2.3")).to.not.equal(-1);
        expect(x["b"].indexOf("1.1.4")).to.not.equal(-1);
        expect(x["c"].indexOf("1.1.2")).to.not.equal(-1);
    });
});

describe("multiple version resolution",function(){

    var __repo__:sync_repository<string>;
    before(function(){
        __repo__ = init_repo()
    })

    it("should handle single packages with *no* dependencies.",function() {
        return __repo__.depends([{name:"a",version:"1.1.2"}])
                .should.eventually.deep.equal([{name:"a",version:"1.1.2"}]);
    });
    it("should handle single packages with *no* dependencies.",function() {
        return __repo__.depends([{name:"a",version:"~1.1.1"}])
                .should.eventually.deep.equal([{name:"a",version:"1.1.3"}]);
    });
    it("should handle single packages with *no* dependencies.",function() {
        __repo__.depends([{name:"a",version:"~1.x"}])
                .should.eventually.deep.equal([{name:"a",version:"1.2.3"}]);
    });

    it("should handle single packages with dependencies.",function() {
        return __repo__.depends([{name:"b",version:"1.0.0"}])
                .should.eventually.deep.equal([{name:"b",version:"1.0.0"},
                                               {name:"a",version:"1.0.0"}]);
    });
    it("should handle single packages with dependencies.",function() {
        return __repo__.depends([{name:"b",version:"1.1.1"}])
                .should.eventually.deep.equal([{name:"b",version:"1.1.1"},
                                               {name:"a",version:"1.1.3"}]);
    });
    it("should handle single packages with dependencies.",function() {
        return __repo__.depends([{name:"b",version:"1.1.3"}])
                .should.eventually.deep.equal([{name:"b",version:"1.1.3"},
                                               {name:"a",version:"1.1.2"}]);
    });
    it("should handle single packages with dependencies.",function() {
        return __repo__.depends([{name:"b",version:"1.1.4"}])
                .should.eventually.deep.equal([{name:"b",version:"1.1.4"},
                                               {name:"a",version:"2.0.0"}]);
    });

    it("should error out on internlly inconsietent specifications .",function() {
        return __repo__.depends([{name:"c",version:"1.1.3"}])
                .should.be.rejectedWith(/Version Conflict:/);
    });

    it("should error out with inconsietent arrays .",function() {
        return __repo__.depends([{name:"a",version:"~1.1.1"},{name:"c",version:"~1.1.3"}])
                .should.be.rejectedWith(/Version Conflict:/);
    });
    it("should error out with inconsietent arrays .",function() {
        return __repo__.depends([{name:"a",version:"~1.1.1"},{name:"b",version:"~1.1.4"}])
                .should.be.rejectedWith(/Version Conflict:/);
    });

    it("should reject confliced dependencies (previously accomodated both).",function() {
        return __repo__.depends([{name:"a",version:"~1.1.1"},{name:"b",version:"~1.1.3"}])
                .should.be.rejectedWith(/Version Conflict:/);;
    });

})

describe("Fetch multiple version",function(){

    it("should handle single packages with *no* dependencies.",function() {
        return __repo__.fetch([{name:"a",version:"1.1.2"}],{dependencies:true})
                .should.eventually.deep.equal([{name:"a",version:"1.1.2",value:"1.1.2"}]);
    });
    it("should handle single packages with *no* dependencies.",function() {
        return __repo__.fetch([{name:"a",version:"~1.1.1"}],{dependencies:true})
                .should.eventually.deep.equal([{name:"a",version:"1.1.3",value:"1.1.3"}]);
    });
    it("should handle single packages with *no* dependencies.",function() {
        __repo__.fetch([{name:"a",version:"~1.x"}],{dependencies:true})
                .should.eventually.deep.equal([{name:"a",version:"1.2.3",value:"1.2.3"}]);
    });

    it("should handle single packages with dependencies.",function() {
        return __repo__.fetch([{name:"b",version:"1.0.0"}],{dependencies:true})
                .should.eventually.deep.equal([{name:"b",version:"1.0.0",value:"1.0.0"},
                                               {name:"a",version:"1.0.0",value:"1.0.0"}]);
    });
    it("should handle single packages with dependencies.",function() {
        return __repo__.fetch([{name:"b",version:"1.1.1"}],{dependencies:true})
                .should.eventually.deep.equal([{name:"b",version:"1.1.1",value:"1.1.1"},
                                               {name:"a",version:"1.1.3",value:"1.1.3"}]);
    });
    it("should handle single packages with dependencies.",function() {
        return __repo__.fetch([{name:"b",version:"1.1.3"}],{dependencies:true})
                .should.eventually.deep.equal([{name:"b",version:"1.1.3",value:"1.1.3"},
                                               {name:"a",version:"1.1.2",value:"1.1.2"}]);
    });
    it("should handle single packages with dependencies.",function() {
        return __repo__.fetch([{name:"b",version:"1.1.4"}],{dependencies:true})
                .should.eventually.deep.equal([{name:"b",version:"1.1.4",value:"1.1.4"},
                                               {name:"a",version:"2.0.0",value:"2.0.0"}]);
    });

    it("should error out on internlly inconsietent specifications .",function() {
        return __repo__.fetch([{name:"c",version:"1.1.3"}],{dependencies:true})
                .should.be.rejectedWith(/Version Conflict:/);
    });

    it("should error out with inconsietent arrays .",function() {
        return __repo__.fetch([{name:"a",version:"~1.1.1"},{name:"c",version:"~1.1.3"}],{dependencies:true})
                .should.be.rejectedWith(/Version Conflict:/);
    });
    it("should error out with inconsietent arrays .",function() {
        return __repo__.fetch([{name:"a",version:"~1.1.1"},{name:"b",version:"~1.1.4"}],{dependencies:true})
                .should.be.rejectedWith(/Version Conflict:/);
    });

    it("should reject confliced dependencies (previously accomodated both).",function() {
        return __repo__.fetch([{name:"a",version:"~1.1.1"},{name:"b",version:"~1.1.3"}],{dependencies:true})
                .should.be.rejectedWith(/Version Conflict:/);;
    });

});

