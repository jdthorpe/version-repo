
//TODO: tests for object (json) as well as string reposotories.
//TODO: tests verifying that dependencies are updated and/or deleted with updates / upserts / deletes
//TODO: tests verifying only the latest version can be deleted / updated
//TODO: tests for repo.create(... , {upsert:true}) << future feature >> 


import chai = require('chai');
import temp = require('temp');
import * as Promise from "bluebird"
const should = chai.should(),
      expect = chai.expect;

import { repository, deferred_readable_repository } from   "../src/typings";

export interface backend_test_instance {
    name: string;
    repo: repository<any> | 
        deferred_readable_repository<any> ;
    backend?: repository<any>;
    before?: (done?:() => void) => void|Promise<any>;
    after?: (done?:() => void) => void|Promise<any>;
    beforeEach?: (done?:() => void) => void|Promise<any>;
    afterEach?: (done?:() => void) => void|Promise<any>;
}

export function generate_backend_tests(test:backend_test_instance):void{

    describe("< Repo.depends > " + test.name, function(){

        before(() => {

            if (test.before) {

                return Promise.resolve(test.before()).then((x) =>  { 

                    if (test.backend) {
                        return populate_repo(test.backend); 
                    } else {
                        return populate_repo(<repository<any>>(test.repo)); 
                    }
                })

            }else{
                if (test.backend) {
                    return populate_repo(test.backend); 
                } else {
                    return populate_repo(<repository<any>>(test.repo)); 
                }
            }

        });


        if(test.after!== undefined) after(test.after)
        if(test.beforeEach!== undefined) beforeEach(test.beforeEach)
        if(test.afterEach!== undefined) afterEach(test.afterEach)


        describe("repo.version()",function(){

            it("version(name) should return an array",function() {
                return Promise.all([
                    Promise.resolve(test.repo.versions("a")).then(Array.isArray).should.eventually.be.true,
                    Promise.resolve(test.repo.versions("b")).then(Array.isArray).should.eventually.be.true,
                    Promise.resolve(test.repo.versions("c")).then(Array.isArray).should.eventually.be.true,
                ]);
            });

            it("version() should return an dictionary of strings",function() {
                return Promise.resolve(test.repo.versions())
                        .then( x => {
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
                        })
            });
        });

        describe("multiple version resolution",function(){

            it("should handle single packages with *no* dependencies.",function() {
                return Promise.resolve(test.repo.depends([{name:"a",version:"1.1.2"}]))
                        .should.eventually.deep.equal([{name:"a",version:"1.1.2"}]);
            });

            it("should handle single packages with *no* dependencies.",function() {
                return Promise.resolve(test.repo.depends([{name:"a",version:"~1.1.1"}]))
                        .should.eventually.deep.equal([{name:"a",version:"1.1.3"}]);
            });

            it("should handle single packages with *no* dependencies.",function() {
                return Promise.resolve(test.repo.depends([{name:"a",version:"~1.x"}]))
                        .should.eventually.deep.equal([{name:"a",version:"1.2.3"}]);
            });

            it("should handle single packages with dependencies.",function() {
                return Promise.resolve(test.repo.depends([{name:"b",version:"1.0.0"}]))
                        .should.eventually.deep.equal([{name:"b",version:"1.0.0"},
                                                       {name:"a",version:"1.0.0"}]);
            });
            it("should handle single packages with dependencies.",function() {
                return Promise.resolve(test.repo.depends([{name:"b",version:"1.1.1"}]))
                        .should.eventually.deep.equal([{name:"b",version:"1.1.1"},
                                                       {name:"a",version:"1.1.3"}]);
            });
            it("should handle single packages with dependencies.",function() {
                return Promise.resolve(test.repo.depends([{name:"b",version:"1.1.3"}]))
                        .should.eventually.deep.equal([{name:"b",version:"1.1.3"},
                                                       {name:"a",version:"1.1.2"}]);
            });
            it("should handle single packages with dependencies.",function() {
                return Promise.resolve(test.repo.depends([{name:"b",version:"1.1.4"}]))
                        .should.eventually.deep.equal([{name:"b",version:"1.1.4"},
                                                       {name:"a",version:"2.0.0"}]);
            });

            it("should error out on internlly inconsietent specifications .",function() {
                var request;
                try{
                    request = Promise.resolve(test.repo.depends([{name:"c",version:"1.1.3"}]))
                }catch(err){
                    request = Promise.reject(err)
                }
                return request.should.be.rejectedWith(/Version Conflict:/);
            });

            it("should error out with inconsietent arrays .",function() {
                var request;
                try{
                    request = Promise.resolve(test.repo.depends([{name:"a",version:"~1.1.1"},{name:"c",version:"~1.1.3"}]))
                }catch(err){
                    request = Promise.reject(err)
                }
                return request.should.be.rejectedWith(/Version Conflict:/);
            });
            it("should error out with inconsietent arrays .",function() {
                var request;
                try{
                    request = Promise.resolve(test.repo.depends([{name:"a",version:"~1.1.1"},{name:"b",version:"~1.1.4"}]))
                }catch(err){
                    request = Promise.reject(err)
                }
                return request.should.be.rejectedWith(/Version Conflict:/);
            });

            it("should reject confliced dependencies (previously accomodated both).",function() {
                var request;
                try{
                    request = Promise.resolve(test.repo.depends([{name:"a",version:"~1.1.1"},{name:"b",version:"~1.1.3"}]))
                }catch(err){
                    request = Promise.reject(err)
                }
                return request.should.be.rejectedWith(/Version Conflict:/);;
            });

        })

        describe("Fetch multiple version",function(){

            it("should handle single packages with *no* dependencies.",function() {
                return Promise.resolve(test.repo.fetch([{name:"a",version:"1.1.2"}],{dependencies:true}))
                        .then(x => x.map(y => {return {name:y.name,version:y.version,value:y.value};}))
                        .should.eventually.deep.equal([{name:"a",version:"1.1.2",value:"1.1.2"}]);
            });
            it("should handle single packages with *no* dependencies.",function() {
                return Promise.resolve(test.repo.fetch([{name:"a",version:"~1.1.1"}],{dependencies:true}))
                        .then(x => x.map(y => {return {name:y.name,version:y.version,value:y.value};}))
                        .should.eventually.deep.equal([{name:"a",version:"1.1.3",value:"1.1.3"}]);
            });
            it("should handle single packages with *no* dependencies.",function() {
                Promise.resolve(test.repo.fetch([{name:"a",version:"~1.x"}],{dependencies:true}))
                        .then(x => x.map(y => {return {name:y.name,version:y.version,value:y.value};}))
                        .should.eventually.deep.equal([{name:"a",version:"1.2.3",value:"1.2.3"}]);
            });

            it("should handle single packages with dependencies.",function() {
                return Promise.resolve(test.repo.fetch([{name:"b",version:"1.0.0"}],{dependencies:true}))
                        .then(x => x.map(y => {return {name:y.name,version:y.version,value:y.value};}))
                        .should.eventually.deep.equal([{name:"b",version:"1.0.0",value:"1.0.0"},
                                                       {name:"a",version:"1.0.0",value:"1.0.0"}]);
            });
            it("should handle single packages with dependencies.",function() {
                return Promise.resolve(test.repo.fetch([{name:"b",version:"1.1.1"}],{dependencies:true}))
                        .then(x => x.map(y => {return {name:y.name,version:y.version,value:y.value};}))
                        .should.eventually.deep.equal([{name:"b",version:"1.1.1",value:"1.1.1"},
                                                       {name:"a",version:"1.1.3",value:"1.1.3"}]);
            });
            it("should handle single packages with dependencies.",function() {
                return Promise.resolve(test.repo.fetch([{name:"b",version:"1.1.3"}],{dependencies:true}))
                        .then(x => x.map(y => {return {name:y.name,version:y.version,value:y.value};}))
                        .should.eventually.deep.equal([{name:"b",version:"1.1.3",value:"1.1.3"},
                                                       {name:"a",version:"1.1.2",value:"1.1.2"}]);
            });
            it("should handle single packages with dependencies.",function() {
                return Promise.resolve(test.repo.fetch([{name:"b",version:"1.1.4"}],{dependencies:true}))
                        .then(x => x.map(y => {return {name:y.name,version:y.version,value:y.value};}))
                        .should.eventually.deep.equal([{name:"b",version:"1.1.4",value:"1.1.4"},
                                                       {name:"a",version:"2.0.0",value:"2.0.0"}]);
            });

            it("should error out on internlly inconsietent specifications .",function() {
                var request;
                try{
                    request = Promise.resolve(test.repo.fetch([{name:"c",version:"1.1.3"}],{dependencies:true}))
                }catch(err){
                    request = Promise.reject(err)
                };
                return request.should.be.rejectedWith(/Version Conflict:/);
            });

            it("should error out with inconsietent arrays .",function() {
                var request;
                try{
                    request = Promise.resolve(test.repo.fetch([{name:"a",version:"~1.1.1"},{name:"c",version:"~1.1.3"}],{dependencies:true}))
                }catch(err){
                    request = Promise.reject(err)
                }
                return request.should.be.rejectedWith(/Version Conflict:/);
            });
            it("should error out with inconsietent arrays .",function() {
                var request;
                try{
                    request = Promise.resolve(test.repo.fetch([{name:"a",version:"~1.1.1"},{name:"b",version:"~1.1.4"}],{dependencies:true}))
                }catch(err){
                    request = Promise.reject(err)
                }
                return request.should.be.rejectedWith(/Version Conflict:/);
            });

            it("should reject confliced dependencies (previously accomodated both).",function() {
                var request;
                try{
                    request = Promise.resolve(test.repo.fetch([{name:"a",version:"~1.1.1"},{name:"b",version:"~1.1.3"}],{dependencies:true}))
                }catch(err){
                    request = Promise.reject(err)
                }
                return request.should.be.rejectedWith(/Version Conflict:/);;
            });

        });
    })
}

function populate_repo( repo: repository<any> ):Promise<any>{

    // create the testing repository.
    return Promise.all([
        Promise.resolve(repo.create({name:"a",version:"1.0.0",value:"1.0.0"})),
        Promise.resolve(repo.create({name:"a",version:"1.1.1",value:"1.1.1"})),
        Promise.resolve(repo.create({name:"a",version:"1.1.2",value:"1.1.2"})),
        Promise.resolve(repo.create({name:"a",version:"1.1.3",value:"1.1.3"})),
        Promise.resolve(repo.create({name:"a",version:"1.2.3",value:"1.2.3"})),
        Promise.resolve(repo.create({name:"a",version:"2.0.0",value:"2.0.0"})),
                                                           
        Promise.resolve(repo.create({name:"b",version:"1.0.0",value:"1.0.0",depends:{"a":"~1.0.0"}})),
        Promise.resolve(repo.create({name:"b",version:"1.1.1",value:"1.1.1",depends:{"a":"~1.1.1"}})),
        Promise.resolve(repo.create({name:"b",version:"1.1.3",value:"1.1.3",depends:{"a":"1.1.2"}})),
        Promise.resolve(repo.create({name:"b",version:"1.1.4",value:"1.1.4",depends:{"a":"~2.0.0"}})),
                                                           
        Promise.resolve(repo.create({name:"c",version:"1.0.0",value:"1.0.0"})),
        Promise.resolve(repo.create({name:"c",version:"1.1.1",value:"1.1.1",depends:{"b":"~1.1.1"}})),
        Promise.resolve(repo.create({name:"c",version:"1.1.2",value:"1.1.2",depends:{"b":"~1.1.2"}})),
        Promise.resolve(repo.create({name:"c",version:"1.1.3",value:"1.1.3",depends:{"b":"1.1.1","a":"2.0.0"}})), // internally conflicted;
        Promise.resolve(repo.create({name:"c",version:"1.1.4",value:"1.1.4",depends:{"b":"~1.1.3"}})),
    ])
}


