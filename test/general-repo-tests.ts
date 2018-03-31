
import {   sync_repository, deferred_repository, resource_data } from   "../src/typings";

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

var instances:{name:string, repo:sync_repository<any> | deferred_repository<any> }[] = [  ] ;
instances.push({name: "Memory Repo", 
                repo: new repo.MemoryRepo()});
instances.push({name: "Memory Repo with trivial transform", 
                repo: new repo.sTransform(new repo.MemoryRepo(), (x => x), (x => x))});
instances.push({name: "Memory Repo with trivial async-transform", 
                repo: new repo.dTransform(new repo.MemoryRepo(), (x => x), (x => x))});

// ------------------------------------------------------------
// ------------------------------------------------------------
instances.map(inst => {

    const repo = inst.repo;

    describe(inst.name, function() {

        it('GET / (`packages()`) should return an empty list',function() {
            return Promise.resolve(repo.packages())
                .should.eventually.be.instanceof(Array).and.have.property('length',0);
        });

        it('POST(create) should require a version',function() {
            var request:Promise<any>;
            try{
                request = Promise.resolve(repo.create(<resource_data<any>>{name:'foo'}));
            }
            catch(err){
                request = Promise.reject(err);
            }
            return request.should.eventually.be.rejectedWith( Error, "missing required value options.version");
        });

        it('POST(create) should create a library',function() {
            return Promise.resolve(repo.create({name:'foo',version:'v1.1.1',value:'Lorem Ipsum dolor sit amet, ...'}))
                .should.eventually.equal(true);
        });

        it('POST(create) should create a library',function() {
            // FOR TESTING THE READ ONLY BUFFER
            return Promise.resolve(repo.create({name:'bar',version:'v1.1.1',value:'Lorem Ipsum dolor sit amet, ...'}))
                .should.eventually.equal(true);
        });

        it('versions(name) should return an array',function() {
            // FOR TESTING THE READ ONLY BUFFER
            return Promise.resolve(repo.versions('bar')).then(x => {
                (typeof x).should.equal('object');
                expect(Array.isArray(x)).to.be.true;
                expect(x.indexOf("1.1.1")).to.not.equal(-1);
                expect(x.length).to.equal(1);
            });
        });

        it('versions() return a dictionary',function() {
            // FOR TESTING THE READ ONLY BUFFER
            return Promise.resolve(repo.versions()).then(x => {
                (typeof x).should.equal('object');
                expect(Array.isArray(x)).to.be.false;
                expect(x.hasOwnProperty('foo')).to.be.true;
                x.foo.should.deep.equal(['1.1.1']);
            });
        });

        it('POST(create) should not create a library twice',function() {

            var request:Promise<any>;
            try{
                request = Promise.resolve(repo.create({name:'foo',version:'v1.1.1',value: 'Lorem Ipsum dolor sit amet, ...'}));
            }
            catch(err){
                request = Promise.reject(err);
            }
            return request.should.eventually.be.rejectedWith( Error, "Version (1.1.1) does not exceed the latest version (1.1.1)");
        });

        it('POST(create) should not create a previous version',function() {

            var request:Promise<any>;
            try{
                request = Promise.resolve(repo.create({name:'foo',version:'v1.1.0',value:'Lorem Ipsum dolor sit amet, ...'}));
            }
            catch(err){
                request = Promise.reject(err);
            }
            return request.should.eventually.be.rejectedWith( Error, "Version (1.1.0) does not exceed the latest version (1.1.1)");

        });

        it('fetchOne() should get the library',function() {
            return Promise.resolve(repo.fetchOne({name:'foo',version:'v1.1.1'}))
                .should.eventually.deep.equal( { name: 'foo', version: '1.1.1', value: 'Lorem Ipsum dolor sit amet, ...' }) ;
        });


        it('POST(create) should create a library with a dependency',function() {
            // FOR TESTING THE READ ONLY BUFFER
            return Promise.resolve(repo.create({name:'bar',version:'v1.1.2',value:'Lorem Ipsum dolor sit amet, ...',depends:{"foo":"~1.0.0"}}))
                .should.eventually.equal(true);
        });

        it('fetchOne() should get the library',function() {
            return Promise.resolve(repo.fetchOne({name:'bar',version:'v1.1.2'}))
                .should.eventually.deep.equal( {name:'bar',version:'1.1.2',value:'Lorem Ipsum dolor sit amet, ...',depends:{"foo":"~1.0.0"}}) ;
        });

        it('fetchOne(...,{novalue:treu}) should get the library dependency only ',function() {
            return Promise.resolve(repo.fetchOne({name:'bar',version:'v1.1.2'},{novalue:true}))
                .should.eventually.deep.equal( {name:'bar',version:'1.1.2',depends:{"foo":"~1.0.0"}}) ;
        });

        it('`var x = repo.fetchOne(); x.depends = "foo";` should not modify the dependencies in the repo',function() {
            // setup:
            return Promise.resolve(repo.fetchOne({name:'bar',version:'v1.1.2'}))
                            .then(x => 
                                {
                                    x.depends = {"bar":"1.2.3"};
                                    return repo.fetchOne({name:'bar',version:'v1.1.2'})
                                })
                .should.eventually.deep.equal( {name:'bar',version:'1.1.2',value:'Lorem Ipsum dolor sit amet, ...',depends:{"foo":"~1.0.0"}}) ;
        });


        it('`var x = repo.fetchOne(); x.value = "bar";` should not modify the values in the repo',function() {
            return Promise.resolve(repo.fetchOne({name:'bar',version:'v1.1.2'}))
                            .then(x => {
                                // setup:
                                x.value = {"bar":"1.2.3"}
                                // test:
                                return repo.fetchOne({name:'bar',version:'v1.1.2'})
                            })
                .should.eventually.deep.equal( {name:'bar',version:'1.1.2',value:'Lorem Ipsum dolor sit amet, ...',depends:{"foo":"~1.0.0"}}) ;
        });


        it('PUT(updtate) should require a version',function() {

            var request:Promise<any>;
            try{
                request = Promise.resolve(repo.update(<resource_data<any>>{name:'foo'}));
            }
            catch(err){
                request = Promise.reject(err);
            }
            return request.should.eventually.be.rejectedWith( Error, "missing required value options.version");
        });

        it('put(updtate) should overwrite the library',function() {
            return Promise.resolve(repo.update({name:'foo',version:'v1.1.1',value:'hi there'}))
                .should.eventually.equal(true);
        });

        it('GET(fetch) should get the new library',function() {
            return Promise.resolve(repo.fetchOne({name:'foo',version:'v1.1.1'}))
                .should.eventually.deep.equal( { name: 'foo', version: '1.1.1', value: 'hi there' }) ;
        });

        it('GET(fetch) should not require the version number',function() {
            return Promise.resolve(repo.fetchOne({name:'foo'}))
                .should.eventually.deep.equal( { name: 'foo', version: '1.1.1', value: 'hi there' }) ;
        });

        it('GET "/" (`packages()`) should return the list of libraries',function() {
            return Promise.resolve(repo.packages())
                .should.eventually.be.instanceof(Array).and.deep.equal(['foo','bar']) ;
        });

        it('DELETE /foo should require a version.',function() {

            var request:Promise<any>;
            try{
                request = Promise.resolve(repo.del({name:'foo'}));
            }
            catch(err){
                request = Promise.reject(err);
            }
            return request.should.eventually.be.rejectedWith( Error, "missing required value options.version");
        });

        it('DELETE /foo not fail',function() {
            return Promise.resolve(repo.del({name:'foo',version:'1.1.1'}))
                .should.eventually.to.be.true;
        });

        it('GET "/" (`packages()`) should return the list of libraries',function() {
            return Promise.resolve(repo.packages())
                .should.eventually.be.instanceof(Array).and.deep.equal(['bar']) ;
        });

    })
})


