
import chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
var expect = chai.expect;

import {MemoryRepo} from '../src/memory_repo';
var Que = require('q');
Que.longStackSupport = true;

import { package_loc } from "../src/typings"

import { calculate_dependencies } from '../src/version_resolution';

//-- for(var i = 0; i < 2 ; i++){

    // create the testing repository.
    var repo = new MemoryRepo<package_loc[]>();

//--     if(i === 0){ // parameterized with JSON strings
//-- 
//--         repo.create({name:"a",version:"1.0.0"},'{}');
//--         repo.create({name:"a",version:"1.1.1"},'{}');
//--         repo.create({name:"a",version:"1.1.2"},'{}');
//--         repo.create({name:"a",version:"1.1.3"},'{}');
//--         repo.create({name:"a",version:"1.2.3"},'{}');
//--         repo.create({name:"a",version:"2.0.0"},'{}');
//-- 
//--         repo.create({name:"b",version:"1.0.0"},'{"a":"~1.0.0"}');
//--         repo.create({name:"b",version:"1.1.1"},'{"a":"~1.1.1"}');
//--         repo.create({name:"b",version:"1.1.3"},'{"a":"1.1.2"}');
//--         repo.create({name:"b",version:"1.1.4"},'{"a":"~2.0.0"}');
//-- 
//--         repo.create({name:"c",version:"1.0.0"},'{}');
//--         repo.create({name:"c",version:"1.1.1"},'{"b":"~1.1.1"}');
//--         repo.create({name:"c",version:"1.1.2"},'{"b":"~1.1.2"}');
//--         repo.create({name:"c",version:"1.1.3"},'{"b":"1.1.1","a":"2.0.0"}');// internally conflicted;
//--         repo.create({name:"c",version:"1.1.4"},'{"b":"~1.1.3"}');
//-- 
//--     }else{ // parameterized with objects

        repo.create({name:"a",version:"1.0.0"},[]);
        repo.create({name:"a",version:"1.1.1"},[]);
        repo.create({name:"a",version:"1.1.2"},[]);
        repo.create({name:"a",version:"1.1.3"},[]);
        repo.create({name:"a",version:"1.2.3"},[]);
        repo.create({name:"a",version:"2.0.0"},[]);

        repo.create({name:"b",version:"1.0.0"},[{name:"a",version:"~1.0.0"}]);
        repo.create({name:"b",version:"1.1.1"},[{name:"a",version:"~1.1.1"}]);
        repo.create({name:"b",version:"1.1.3"},[{name:"a",version:"1.1.2"}]);
        repo.create({name:"b",version:"1.1.4"},[{name:"a",version:"~2.0.0"}]);

        repo.create({name:"c",version:"1.0.0"},[]);
        repo.create({name:"c",version:"1.1.1"},[{name:"b",version:"~1.1.1"}]);
        repo.create({name:"c",version:"1.1.2"},[{name:"b",version:"~1.1.2"}]);
        repo.create({name:"c",version:"1.1.3"},[{name:"b",version:"1.1.1"},{name:"a",version:"2.0.0"}]);// internally conflicted;
        repo.create({name:"c",version:"1.1.4"},[{name:"b",version:"~1.1.3"}]);

//--     }

    describe('repo.version()',function(){

        it('versoin(name) should return an array',function() {
            expect(Array.isArray(repo.versions('a'))).to.be.true;
            expect(Array.isArray(repo.versions('b'))).to.be.true;
            expect(Array.isArray(repo.versions('c'))).to.be.true;
        });

        it('versoin() should return an dictionary of strings',function() {
            var x = repo.versions();
            (typeof x).should.equal('object');
            var keys = Object.keys(x);
            keys.length.should.equal(3);
            expect(keys.indexOf('a')).to.not.equal(-1);
            (typeof x['a']).should.equal('object');
            expect(Array.isArray(x['a'])).to.be.true;
            expect(Array.isArray(x['b'])).to.be.true;
            expect(Array.isArray(x['c'])).to.be.true;
            expect(x['a'].indexOf('1.2.3')).to.not.equal(-1);
            expect(x['b'].indexOf('1.1.4')).to.not.equal(-1);
            expect(x['c'].indexOf('1.1.2')).to.not.equal(-1);
        });
    });


    describe('multiple version resolution',function(){

        it('should handle single packages with *no* dependencies.',function() {
            return calculate_dependencies([{name:'a',version:'1.1.2'}],repo)
                    .should.eventually.deep.equal([{name:'a',version:'1.1.2'}]);
        });
        it('should handle single packages with *no* dependencies.',function() {
            return calculate_dependencies([{name:'a',version:'~1.1.1'}],repo)
                    .should.eventually.deep.equal([{name:'a',version:'1.1.3'}]);
        });
        it('should handle single packages with *no* dependencies.',function() {
            calculate_dependencies([{name:'a',version:'~1.x'}],repo)
                    .should.eventually.deep.equal([{name:'a',version:'1.2.3'}]);
        });

        it('should handle single packages with dependencies.',function() {
            return calculate_dependencies([{name:'b',version:'1.0.0'}],repo)
                    .should.eventually.deep.equal([{name:'b',version:"1.0.0"},{name:'a',version:'1.0.0'}]);
        });
        it('should handle single packages with dependencies.',function() {
            return calculate_dependencies([{name:'b',version:'1.1.1'}],repo)
                    .should.eventually.deep.equal([{name:'b',version:"1.1.1"},{name:'a',version:'1.1.3'}]);
        });
        it('should handle single packages with dependencies.',function() {
            return calculate_dependencies([{name:'b',version:'1.1.3'}],repo)
                    .should.eventually.deep.equal([{name:'b',version:"1.1.3"},{name:'a',version:'1.1.2'}]);
        });
        it('should handle single packages with dependencies.',function() {
            return calculate_dependencies([{name:'b',version:'1.1.4'}],repo)
                    .should.eventually.deep.equal([{name:'b',version:"1.1.4"},{name:'a',version:'2.0.0'}]);
        });

        it('should error out on internlly inconsietent specifications .',function() {
            return calculate_dependencies([{name:'c',version:'1.1.3'}],repo)
                    .should.be.rejectedWith(/Version Conflict:/);
        });

        it('should error out with inconsietent arrays .',function() {
            return calculate_dependencies([{name:'a',version:'~1.1.1'},{name:'c',version:'~1.1.3'}],repo)
                    .should.be.rejectedWith(/Version Conflict:/);
        });
        it('should error out with inconsietent arrays .',function() {
            return calculate_dependencies([{name:'a',version:'~1.1.1'},{name:'b',version:'~1.1.4'}],repo)
                    .should.be.rejectedWith(/Version Conflict:/);
        });

        it('should reject confliced dependencies (previously accomodated both).',function() {
            return calculate_dependencies([{name:'a',version:'~1.1.1'},{name:'b',version:'~1.1.3'}],repo)
                    .should.be.rejectedWith(/Version Conflict:/);;
        });

    });

//-- }
