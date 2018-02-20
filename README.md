A suite of repositories with [semantic
versioning](https://www.npmjs.com/package/semver) of objects and their
dependencies. 

## Description

This is yet another solution to the age old problem of managing multiple
versions of resources and the versions of other resources on which each depends. 
Unlike software version control, `Version-Repo` is agnostic as to what is being
stored, and provides a flexible framework for persisting and transforming
variety of objects.


### Overview: 

`Version-Repo`'s come in two varieties: Stores (file, DB, memory, etc.) and
Middleware (buffers, transformers, express routers, etc.).  Repositories can
implement Read-Only, or Read-Write interfaces and each provides at least one of
several CRUD methods (Create, Fetch, Update, Delete). Finally, repositories
may implement synchronous or deferred (Promise based) API's. The various API's
are documented in the included `./src/typings.d.ts` file.


Finally, the included function `calculate_dependencies` implements the
[C3](http://www.python.org/download/releases/2.3/mro/) algorithm for
identifying a consistent set of resources from an array of resources and their
required version.


### Examples:

Note that these examples also demonstrate
[version-repo-node](https://www.npmjs.com/package/version-repo-node) and make
use of [temp](https://www.npmjs.com/package/temp)

```JavaScript
// Create an in-memory versioned repository
var repo = require('versioned-repo'),
	my_mem_repo= repo.memory(),


// Create a repo using the local file system (NodeJS)
var temp = require('temp'), // requires npm install temp
	path = require('path'),
	node_repo = require('versioned-repo-node'),
	temp_dir = temp.mkdirSync(),
	my_file_repo = node_repo.file({directory:path.join(temp_dir,"my_repo_files")}),

// Wrap the file system repo in a read-only buffer
var buffered_file_repo = repo.readonly_buffer(my_file_repo);

// Expose the buffered file repo via an Express HTTP server
var express = require('express'),
	app = express();
	app.use('/my_repo',
		repo.router({
			repository:buffered_file_repo,
			version_repo:my_mem_repo,
		}));
var server = ('function' === typeof app) ? http.createServer(app) : app;
server.listen(0);

// Create a "remote" repo which provides access to the express router router via http:
var address =  server.address();
if (!address) {
    server.listen(0);
    address = server.address();
}
var protocol = (server instanceof https.Server) ? 'https:' : 'http:';
var hostname = address.address;
if (hostname === '0.0.0.0' || hostname === '::') {
    hostname = '127.0.0.1';
}
var base_url = protocol + '//' + hostname + ':' + address.port ;
var remote_repo = new repo.remote({
    'base_url':base_url + '/my_repo',
})

// Create a transformer which transforms strings from the remote repo to JSON
// objects (and back, when storing objects):
json_repo = dTransform(// d is for deferred
		remote_repo,
		JSON.stringify, // for storing objects
		JSON.parse);    // for parsing stored strings


// ----------------------
// Now some actual CRUD
// ----------------------

// store a string in the file-system based repo
my_file_repo.creae({name:"my-resource",version:"1.2.3"},
					'{"hello":"world"}'
					).then(() => {

	// then fetch it from the JSON repo
	return json_repo.fetch({name:"my-resource",version:"^1.x"});

}).then((resource) => {
	
	console.log(resource.object);   // eventually logs: { hello: 'world' }
	console.log(resource.version);  // eventually logs: '1.2.3'
	
	// enumerate packages
	return json_repo.packages();

}).then((resources) => {
	
	console.log(resources);  // eventually logs: [ 'my-resource' ]	
	
	// get the latest version of a package
	return json_repo.latest_version();

}).then((version) => {
	
	console.log(version);  // eventually logs: '1.2.3'
	
	// get the latest version of a package
	return json_repo.versions();

}).then((versions) => {
	
	console.log(versions);  // eventually logs: [ '1.2.3' ]
	
	// Calculate the set of matching dependencies for an array of required objects.
	// (This is admittedly a trivial example, see the test files for more complex examples):
	return calculate_dependencies([ {name:"my-resource",version:"^1.0.0"}, ],json_repo);

}).then((dependents) => {
	
	console.log(dependents);  // eventually logs: [ { name: 'my-resource', version: '1.2.3' } ]	

})

<!--

// sugar / cruft
my_remote_repo.resolve({'a','~1.1.1'})


NOTE THAT THE FOLLOWING IS NOT ITEMPOTENT, so it's important not to
`upload.array()` on a parent of the a route that the 

```JavaScript
	var multer = require('multer'); // v1.0.5
	var upload = multer(); // for parsing multipart/form-data
	app.use('/',upload.array())
```

-->
