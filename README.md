A suite of repositories with [semantic
versioning](https://www.npmjs.com/package/semver) of objects and their
dependencies. 

## Idea in Brief

This is yet another solution to the age old problem of managing multiple
versions of resources and the versions of other resources on which each depends. 
Unlike software version control, `Version-Repo` is agnostic as to what is being
stored, and provides a flexible framework for persisting and transforming
variety of objects.

## Examples

### Storing Objects: 

A versioned repository lets you store thigs with a name and version: 
```javascript
var R = require("version-repo");
var repo = new R.MemoryRepo();
repo.create({name:"A",version:"v1.1.1",value:"My great thing"});
repo.create({name:"A",version:"v1.1.2",value:"An even better thing"});
repo.create({name:"A",version:"v1.1.5",value:"The best thing yet"});
repo.create({name:"A",version:"2.0.0", value:"Something different"});
```

### Fetching Objects: 

Fetching an object by it's name will get you the latest version of that object:

```javascript
repo.fetch({name:"A"});
// { name: "A",
//   version: "2.0.0",
//   value: "Something different" }
```

and you can query for an value using valid semver version strings

```javascript
repo.fetch({"A":"1.1.1"}).value // "My great thing"
repo.fetch({"A":"1.1.x"}).value // "The best thing yet"
repo.fetch({"A":"~1"}).value    // "The best thing yet"
repo.fetch({"A":"1.1.3 - 1.1.7 || >=2.5.0"}).value // "The best thing yet"
```

### Managing dependencies: 

Let's say project `A` has matured ab bit more, and we've started working on
projects B and C, that depend on each other:

```javascript
repo.create({name:"A",version:"1.0.0",value:"abc"});
repo.create({name:"A",version:"1.1.1",value:"Abc"});
repo.create({name:"A",version:"1.1.2",value:"aBc"});
repo.create({name:"A",version:"1.1.3",value:"abC"});
repo.create({name:"A",version:"1.2.3",value:"ABc"});
repo.create({name:"A",version:"2.0.0",value:"ABC"});

repo.create({name:"B",version:"1.0.0",value:"def",depends:{"A":"~1.0.0"});
repo.create({name:"B",version:"1.1.1",value:"Def",depends:{"A":"~1.1.1"});
repo.create({name:"B",version:"1.1.3",value:"DEf",depends:{"A":"1.1.2"});
repo.create({name:"B",version:"1.1.4",value:"DEF",depends:{"A":"~2.0.0"});

repo.create({name:"C",version:"1.0.0",value:"efg");
repo.create({name:"C",version:"1.1.1",value:"Efg",depends:{"B":"~1.1.1"});
repo.create({name:"C",version:"1.1.2",value:"EFg",depends:{"B":"~1.1.2"});
repo.create({name:"C",version:"1.1.3",value:"EFg",depends:{"B":"1.1.1","A":"2.0.0"});
repo.create({name:"C",version:"1.1.4",value:"efG",depends:{"B":"~1.1.3"});
```

With a more mature repository and a variety of version and dependencies, we can
execute queries that guarantee consistency of requirements when they succeed:

```javascript
// Calculate dependencies 
repo.depends({B:"1.1.4"}) // {A:"2.0.0",B:"1.1.4",}
repo.depends({B:"1.1.4",C:"1.1.1"}) // {A:"2.0.0",B:"1.1.4",C:"1.1.1"}


// fetch the resources and their dependents:

repo.fetch([{name:"B",version:"1.1.4"}],{dependencies=true}) 
// -> [{name:A,version:"2.0.0",value:"ABC"},
//     {name:"B",version:"1.1.4",]
```

And likewise, it protects you from fetching conflicted set of resources by
throwing a `Version Conflict` error when there is no compatible set of
resources which satisfies your query:

```javascript
// Each of these raises a Version Conflict error
repo.dependencies([{"B":"1.1.1"},{"A":"2.0.0"}]) 
repo.fetch([{"B":"1.1.1"},{"A":"2.0.0"}])
repo.fetch([{"C":"1.1.3"}])
```

### Updating Resources: 

A resource either can be updated using either `update()` method or the
`insert()` method with the option `upsert:true`:

```javascript
repo.update({name:'A',version:'2.0.0',value:"something else"})
repo.insert({name:'A',version:'2.0.0',value:"something else",upsert:true})
```

However by default you may only update the latest version of the resource,
which can be changed by setting `update:"any"` or `update:"none"` when
instantiating the repo. 

### Deleting Resources: 

A resource can be deleted using the `del()` method:

```javascrspt
repo.del({name:'A',version:'2.0.0'})
```

However by default you may only update the latest version of the resource,
which can be changed by setting `delete:"any"` or `delete:"none"` when
instantiating the repo. 

# Repositories Classes

### MemoryRepo

A repository which keeps resources in memory.

#### Instantiation: 
```
new require("version-repo").MemoryRepo()
```

### AsyncMemoryRepo

An asynchronous repository which keeps resources in memory.

#### Init args: 
```
new require("version-repo").AsyncMemoryRepo()
```

### Buffer

A repository which queries another repository for resources which it does not
contain, and caches previously requested resources. This is particularly useful
for caching within a browser session.

#### Init args: 

```
new require("version-repo").AsyncBuffer(repo)
```
- repo:

### AsyncBuffer

An asynchronous  repository which queries another repository for resources which it does not
contain, and caches previously requested resources. This is particularly useful
for caching within a browser session.

#### Init args: 

```
new require("version-repo").AsyncBuffer(repo)
```
- repo:


### RemoteRepo

An asynchronous repository which forwards all requests to another
version-repository over http.  (The **`RouterRepo`** class available in the
[version-repo-node](https://www.npmjs.com/package/version-repo-node) wraps
another repository with an HTTP interface).

#### Init args: 

```
new require("version-repo").Transformer(url)
```
- url


### Transformer

A repo which forwards all requests to another version repo and performs
transformations of the objects in transit. This is particularly useful for
wrapping string-only repositories (i.e. `FileRepo` in the
[version-repo-node](https://www.npmjs.com/package/version-repo-node)package) by
providing parse-on-read and stringify-on-write logic.

#### Init args: 
```
new require("version-repo").Transformer(repo,storify,destorify)
```
- repo
- storify
- destorify


### AsyncTransformer

An asynchronous repo which forwards all requests to another version repo and
performs transformations of the objects in transit. This is particularly useful
for wrapping string-only repositories (i.e. `FileRepo` in the
[version-repo-node](https://www.npmjs.com/package/version-repo-node) package)
by providing parse-on-read and stringify-on-write logic.

#### Init args: 

```
new require("version-repo").AsyncTransformer(repo,storify,destorify)
```

- repo
- storify
- destorify



# API

## Synchronous API




## Asynchronous API

Method signatures are the same as the synchronous versions, but return a [bluebird
promise](http://bluebirdjs.com/docs/getting-started.html) for each return value.


------------------------------------------------------------
------------------------------------------------------------
------------------------------------------------------------



### Overview: 

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


