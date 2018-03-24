//-- 
//-- import chai = require('chai');
//-- const should = chai.should(),
//--       expect = chai.expect;
//-- 
//-- import repo = require('../index');
//-- 
//-- // ------------------------------------------------------------
//-- 
//-- 
//-- describe('Memory Repo', function() {
//-- 
//--     var memory_repo = new repo.MemoryRepo();
//-- 
//--     it('GET / (`packages()`) should return an empty list',function() {
//--         memory_repo.packages()
//--             .should.be.instanceof(Array).and.have.property('length',0);
//--     });
//-- 
//--     it('POST(create) should require a version',function() {
//--         expect(function(){memory_repo.create({name:'foo'})})
//--             .to.throw( Error,
//--                     "missing required value options.version");
//--     });
//-- 
//--     it('POST(create) should create a library',function() {
//--         memory_repo.create({name:'foo',version:'v1.1.1',value:'My favorite equations'})
//--             .should.equal(true);
//--     });
//-- 
//--     it('POST(create) should create a library',function() {
//--         // FOR TESTING THE READ ONLY BUFFER
//--         memory_repo.create({name:'bar',version:'v1.1.1',value:'My favorite equations'})
//--             .should.equal(true);
//--     });
//-- 
//--     it('versions(name) return an array',function() {
//--         // FOR TESTING THE READ ONLY BUFFER
//--         console.log("typeof memory_repo.versions: ", typeof memory_repo.versions);
//--         var x = memory_repo.versions('bar');
//--         (typeof x).should.equal('object');
//--         expect(Array.isArray(x)).to.be.true;
//--         expect(x.indexOf("1.1.1")).to.not.equal(-1);
//--         expect(x.length).to.equal(1);
//--     });
//-- 
//--     it('versions() return a dictionary',function() {
//--         // FOR TESTING THE READ ONLY BUFFER
//--         console.log("typeof memory_repo.versions: ", typeof memory_repo.versions);
//--         var x = memory_repo.versions();
//--         (typeof x).should.equal('object');
//--         expect(Array.isArray(x)).to.be.false;
//--         expect(x.hasOwnProperty('foo')).to.be.true;
//--         x.foo.should.deep.equal(['1.1.1']);
//--     });
//-- 
//--     it('POST(create) should not create a library twice',function() {
//--         expect(function(){memory_repo.create({name:'foo',version:'v1.1.1',value: 'My favorite equations'})})
//--             .to.to.throw( Error,
//--                     "Version (1.1.1) does not exceed the latest version (1.1.1)");
//--     });
//-- 
//--     it('POST(create) should not create a previous version',function() {
//--         expect(function(){memory_repo.create({name:'foo',version:'v1.1.0',value:'My favorite equations'})})
//--             .to.throw( Error,
//--                     "Version (1.1.0) does not exceed the latest version (1.1.1)");
//--     });
//-- 
//--     it('fetch() should get the library',function() {
//--         memory_repo.fetchOne({name:'foo',version:'v1.1.1'})
//--             .should.deep.equal( { name: 'foo', version: '1.1.1', value: 'My favorite equations' }) ;
//--     });
//-- 
//-- 
//--     it('POST(create) should create a library with a dependency',function() {
//--         // FOR TESTING THE READ ONLY BUFFER
//--         memory_repo.create({name:'bar',version:'1.1.2',value:'My favorite equations',depends:{"foo":"~1.0.0"}})
//--             .should.equal(true);
//--     });
//-- 
//--     it('fetch() should get the library',function() {
//--         memory_repo.fetchOne({name:'bar',version:'v1.1.2'})
//--             .should.deep.equal( {name:'bar',version:'1.1.2',value:'My favorite equations',depends:{"foo":"~1.0.0"}}) ;
//--     });
//-- 
//--     it('fetch(...,{novalue:treu}) should get the library dependency only ',function() {
//--         memory_repo.fetchOne({name:'bar',version:'v1.1.2'},{novalue:true})
//--             .should.deep.equal( {name:'bar',version:'1.1.2',depends:{"foo":"~1.0.0"}}) ;
//--     });
//-- 
//--     it('PUT(updtate) should require a version',function() {
//--         expect(function(){memory_repo.update({name:'foo'})})
//--             .to.throw( Error, "missing required value options.version");
//--     });
//-- 
//--     it('put(updtate) should overwrite the library',function() {
//--         memory_repo.update({name:'foo',version:'v1.1.1',value:'hi there'}).should.equal(true);
//--     });
//-- 
//--     it('GET(fetch) should get the new library',function() {
//--         memory_repo.fetchOne({name:'foo',version:'v1.1.1'})
//--             .should.deep.equal( { name: 'foo', version: '1.1.1', value: 'hi there' }) ;
//--     });
//-- 
//--     it('GET(fetch) should not require the version number',function() {
//--         memory_repo.fetchOne({name:'foo'})
//--             .should.deep.equal( { name: 'foo', version: '1.1.1', value: 'hi there' }) ;
//--     });
//-- 
//--     it('GET "/" (`packages()`) should return the list of libraries',function() {
//--         memory_repo.packages()
//--             .should.be.instanceof(Array).and.deep.equal(['foo','bar']) ;
//--     });
//-- 
//--     it('DELETE /foo should require a version.',function() {
//--         expect(function(){memory_repo.del({name:'foo'})})
//--             .to.throw( Error,"missing required value options.version");
//--     });
//-- 
//--     it('DELETE /foo not fail',function() {
//--         expect(memory_repo.del({name:'foo',version:'1.1.1'})).to.be.true;
//--     });
//-- 
//--     it('GET "/" (`packages()`) should return the list of libraries',function() {
//--         memory_repo.packages()
//--             .should.be.instanceof(Array).and.deep.equal(['bar']) ;
//--     });
//-- 
//-- })
//-- 
//-- 
