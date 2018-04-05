A suite of repositories with [semantic
versioning](https://www.npmjs.com/package/semver) of objects and their
dependencies.  **Think Bower, but for anything, not just JS code**

### The Problem:

You've got lots of things (code, data, whatever), and you've got multiple
versions of your things.  Furthermore your things only work when paired with
the right versions of other things.

### The Solution: 

Version-repo's are typed repositories that store named values, their
[version](https://semver.org/), and their requirements (dependencies). Version
repo's take care of the logic of finding a complete and consistent set of
resources for a given query.

Furthermore, there are a variety of version-repo's which simplify the process
of storing your object on disk, in memory, or in a database; serving and
querying them http/https, and perfomning tranformations when storing and/or
fetching your resources (e.g. stringifying / parsing JSON objects stored on
disk).


<!-- =============================================== -->
# API
<!-- =============================================== -->

## Storing resources

Resources are stored using the `create()` method, like so:

```javascript
var R = require("version-repo");
var repo = new R.MemoryRepo();
repo.create({name:"A",version:"v1.1.1",value:"My great thing"});
repo.create({name:"A",version:"v1.1.2",value:"An even better thing"});
repo.create({name:"A",version:"v1.1.5",value:"The best thing yet"});
repo.create({name:"A",version:"2.0.0", value:"Something different"});
```

## Retrieving resources

Resources are queried using the `fetch()` method, which return an array of matching resources.

```javascript
repo.fetch({name:"A"});
// [{ name: "A",
//   version: "2.0.0",
//   value: "Something different" }]
```

Note that because we didn't specify a version, the latest version of the resource was returned 

In the event that you really only want the specified resource and not the
dependencies, the `fetchOne()` method will do the trick:

```javascript
repo.fetchOne([{name:"A"}]);
// { name: "A",
//   version: "2.0.0",
//   value: "Something different" }
```

older versions of a resource can be queried by passing a `version` parameter:

```javascript
repo.fetch([{name:"A",version:"1.1.1"}]).value // "My great thing"
```

and we can use the a query object of for as shorthand for an array of name/version pairs:

```javascript
repo.fetch({"A":"1.1.1"}).value // "My great thing"
repo.fetch({"A":"1.1.1"}).value // "My great thing"
repo.fetch({"A":"1.1.x"}).value // "The best thing yet"
repo.fetch({"A":"~1"}).value    // "The best thing yet"
repo.fetch({"A":"1.1.3 - 1.1.7 || >=2.5.0"}).value // "The best thing yet"
```

## Fetching Multiple Resources: 

So far we've stored several vesions of a single resource, but the real purpose
of the version repo's is to manage multiple resources and their versions. For
this, we'll neeed a more complicated example: 

```javascript
repo.create({name:"A",version:"1.0.0",value:"abc"});
repo.create({name:"A",version:"1.1.1",value:"Abc"});
repo.create({name:"A",version:"1.1.2",value:"aBc"});
repo.create({name:"A",version:"1.1.3",value:"abC"});
repo.create({name:"A",version:"1.2.3",value:"ABc"});
repo.create({name:"A",version:"2.0.0",value:"ABC"});

repo.create({name:"B",version:"1.0.0",value:"def",requires:{"A":"~1.0.0"});
repo.create({name:"B",version:"1.1.1",value:"Def",requires:{"A":"~1.1.1"});
repo.create({name:"B",version:"1.1.3",value:"DEf",requires:{"A":"1.1.2"});
repo.create({name:"B",version:"1.1.4",value:"DEF",requires:{"A":"~2.0.0"});

repo.create({name:"C",version:"1.0.0",value:"efg");
repo.create({name:"C",version:"1.1.1",value:"Efg",requires:{"B":"~1.1.1"});
repo.create({name:"C",version:"1.1.2",value:"EFg",requires:{"B":"~1.1.2"});
repo.create({name:"C",version:"1.1.3",value:"EFg",requires:{"B":"1.1.1","A":"2.0.0"}); // this set of requirements are in conflict...
repo.create({name:"C",version:"1.1.4",value:"efG",requires:{"B":"~1.1.3"});
```

with our more mature repository, we can query the complete set of resources
that are required for by our query using the `feth()` method:

```javascript
repo.fetch([{name:"B",version:"1.1.4"}]) 
```

similarly,  the `requires()` method will return list of resources which match
your query, (but not the resources themselves...)

```javascript
// Calculate dependencies 
repo.requires({B:"1.1.4"}) // {A:"2.0.0",B:"1.1.4",}
repo.requires({B:"1.1.4",C:"1.1.1"}) // {A:"2.0.0",B:"1.1.4",C:"1.1.1"}
```

and to get the list of resources, and their dependencies, but *not* the values, 
we can pass an options object to fetch, specifying the `novealue:true`

```javascript
repo.fetch({B:"1.1.4"},{novalue:true}) 
```


Conveniently, attempting to fetch an conflicted set of resources throws a
`Version Conflict` error, when there is no set of resources
which satisfies your query:

```javascript
// Each of these raises a Version Conflict error
repo.dependencies([{"B":"1.1.1"},{"A":"2.0.0"}]) 
repo.fetch([{"B":"1.1.1"},{"A":"2.0.0"}])
repo.fetch([{"C":"1.1.3"}])
```

## Updating Resources: 

A resource either can be updated using either `update()` method or the
`insert()` method with the option `upsert:true`:

```javascript
repo.update({name:'A',version:'2.0.0',value:"something else"})
repo.insert({name:'A',version:'2.0.0',value:"something else",upsert:true})
```

However by default you may only update the latest version of the resource,
which can be changed by setting `update:"any"` or `update:"none"` when
instantiating the repo. 

## Deleting Resources: 

A resource can be deleted using the `del()` method:

```javascrspt
repo.del({name:'A',version:'2.0.0'})
```

However by default you may only delete the latest version of the resource,
which can be changed by setting `delete:"any"` or `delete:"none"` when
instantiating the repo. 


<!-- =============================================== -->
# Repositories Classes
<!-- =============================================== -->

## MemoryRepo *(API: Synchronous, Stored Types: Any)*

A synchronous repository which keeps resources in memory.

##### Constructor parameters

- config:  An object with the following attributes: 
	- update: (optional) one of "latest" (default), "any", "none"
	- delete: (optional) one of "latest" (default), "any", "none"

##### Example :

```javascript
var my_repo = new MemoryRepo()
```

<!-- 
 ===============================================
-->
## ReadonlyBuffer *(API: Async, Stored Types: Any)*

A ReadOnly Buffer repository is a read-only wrapper which keeps local copies of
resources queried from another 'host' repository.  This is particularly useful
if the host repo is on another physical machine, for example to reduce the number
of network requests of mobile apps.  Local resources are stored in memory and
calls to create/update/delete methods are forwarded onto the host repository. 


##### Constructor parameters

- repo: A version-repo instance

##### Example :

```javascript
var host_repo = new MemoryRepo()
var my_readonly_repo =new ReadonlyBuffer(host_repo)
```


<!-- 
 ===============================================
-->

## sTransform *(API: Synchronous, Stored Types: Any)*

A *Synchronous* repo which forwards all requests to another version repo and performs
transformations of the stored values on create / update (storifying) and fetch
(de-storifying). 

This is particularly useful for wrapping string-only repositories, such as the
`FileRepo` in the
[version-repo-node](https://www.npmjs.com/package/version-repo-node) package,
with parse-on-read and stringify-on-write logic.  Another use case is for
storing and dispatching *copies* of objects stored in a repo, in whicn case one
of the many deep-copy functions may be used for storifying, and de-storifiying
values.  Transformers could also provide validate-on-save logic by using an
object validator such as the awesome AJV library as a storify, and trivial
function for destorifying (e.g. `function(x){return x;}`)

##### Constructor parameters

- repo: A version-repo instance of type `S`.
- storify: A function used to transform objects as they are stored (`create()`ed) or updated. 
- destorify: A function used to transform stored objects when they are retrieved (`fetch()`ed). 

##### Example :

```javascript
var host_repo = new MemoryRepo()
var my_repo = new sTransform(host_repo,JSON.stringify,JSON.parse)
```

the same examlple in TypeScript with generic typing:

```javascript
var host_repo = new MemoryRepo<string>()
var my_repo = new sTransform<string,any>(host_repo,JSON.stringify,JSON.parse)
```


<!-- 
 ===============================================
-->

## dTransform  *(API: Synchronous, Stored Types: Any)*

An asynchronous (i.e. *Deffered*) repo which forwards all requests to another version repo and
performs transformations of the objects in transit. 

This is particularly useful for wrapping asynchronous repo's with limited storage types, 
such as the File and Remote (HTTP/S) Repo's in
[version-repo-node](https://www.npmjs.com/package/version-repo-node)) 

##### Constructor parameters

- repo: A version-repo instance of type `S`.
- storify: A function used to transform objects on storage on create / update. (`funciton(x:T):S`)
- destorify: A function used to transform objects from storage on fetch. (`funciton(x:T):S`)

Note that the host repo may have a synchronous API, and the storify and/or
de-storify functions may return transformed values or Promised for the
transformed values.

##### Examples:

```javascript
var string_only_repo = new MemoryRepo()
var my_async_repo = new dTransform(string_only_repo,JSON.stringify,JSON.parse)
```

the same examlple in TypeScript with generic types:

```TypeScript
var string_only_repo = new MemoryRepo<string>()
var my_async_repo = new dTransform<string,any>(string_only_repo,JSON.stringify,JSON.parse)
```





<!-- =============================================== -->
<!-- =============================================== -->
# Working with TypeScript
<!-- =============================================== -->
<!-- =============================================== -->

Every repo's that can potentially store any type of object accept a type parameter:

```typescript
import { MemoryRepo } from "version-repo"
const my_string_repo = new MemoryRepo<string>()
```


and synchronous and deferred transform repositories accept two type parameters which
specify the type of the underlying repo, and the type for the API it exposes.
In this example, a FileRepo is used to store serialized objects on disk, and 
an deferred transform repo is used to manage the serialization / de-serialization:

```typescript
                repo: new repo.sTransform(new repo.MemoryRepo(), (x => x), (x => x))});
import { sTransform } from "version-repo"
import { FileRepo } from "version-repo-node"
const my_file_repo = new FileRepo({directory:"/some/place/nice")}) // a string only repo.
const my_object_store = new sTransform<string,any>( my_file_repo JSON.stringify, JSON.parse);  
```

Some repo's can store only a limited set of values, eg. the FileRepo can only accept sting values.

### General API

This package is written in typescripts so explicitly importing `.d.ts` file should not be required.

However generic repo interfaces are defined in `src/typings.d.ts`, and the
synchronous API is provided here for tautological purposes:

#### Synchronous API

```typescript
// an object type used for queries:
export interface package_loc { name:string; version?:string; }

// an object type used for creating and updating resources
export interface resource_data<T> {
    name:string;
    version:string;
    value?:T; // yes it's optional. (i.e. when `fetch_opts.novalue = true`)
    depends?:{[key:string]:string};
    upsert?:boolean
    force?:boolean
}


// the synchronous repo interface
interface sync_repository<T> {
	
    // CRUD: 

    create(resource:resource_data<T>):boolean; // return indicates succes / failure

    update(resource:resource_data<T>):boolean; // return indicates succes / failure

    del(query:package_loc):boolean; // return indicates succes / failure

	// fetch a set of mathing resource
    fetch(query:package_loc|package_loc[],
			fetch_opts?:fetch_opts):resource_data<T>[];

	// fetch a single resource
    fetchOne(query:package_loc,
			 opts?:fetch_opts):resource_data<T>;

	// returns a list of name 
    depends(query:package_loc|package_loc[]|{[key: string]:string}):package_loc[];

    // ENUMERATION:

    packages():string[] ; // returns a list of resource names

    // return a list of available versions of a named resource
    versions():{[x:string]:string[]};

    // return a list of available versions of a named resource
    versions(name:string):string[];

    // returns the lastest version of a named resource
    latest_version(name:string):string

}
```

#### Asynchronous API

Method signatures are the same as the synchronous versions, but return a [bluebird
promise](http://bluebirdjs.com/docs/getting-started.html) for each return value.

------------------------------------------------------------

### Examples:

Note that these examples also demonstrate
[version-repo-node](https://www.npmjs.com/package/version-repo-node) and make
use of [temp](https://www.npmjs.com/package/temp)

```javascript
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

```


