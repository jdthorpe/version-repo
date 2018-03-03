"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var semver_1 = require("semver");
var utils_1 = require("./utils");
//-- import * as Q from 'q';
var Promise = require("bluebird");
var c3_1 = require("./c3");
function calculate_dependencies(
// versions is a dictionary with the where each key correspondes to a
// dependency name, and each value is a string or vector of strings with 
// the available versions for that key
x, dependency_repo) {
    if (!x.every(utils_1.is_package_loc))
        throw new Error("x is not an array of package locations");
    if (dependency_repo === undefined)
        throw new Error("missing dependency_repo");
    var VERSIONS = {};
    var MRO = c3_1.default("main");
    // a graph of require statements for determinig sources of conflict
    var STACKS = {};
    var stack = [];
    var dependencies = x.map(function (y) {
        return { name: y.name,
            version: y.version,
            depth: 0,
        };
    });
    return __resolve__();
    function __resolve__() {
        if (dependencies.length === 0) {
            // We're done! (whew, that was easy).
            return Promise.resolve(MRO.run().slice(1).map(function (name) {
                //console.log("MRO.run().slice(1).map(", name,VERSIONS[name])
                return {
                    name: name,
                    version: VERSIONS[name]
                };
            }));
        }
        else {
            // acuquire the next dependenciy
            var d = dependencies.shift();
            MRO.add((d.depth > 0) ? stack[d.depth - 1].name : "main", d.name);
            if (VERSIONS.hasOwnProperty(d.name)) {
                // THE VERSION OF THIS PACKAGE HAS ALREADY BEEN DETERMINED
                if (!semver_1.satisfies(VERSIONS[d.name], d.version)) {
                    // THE NEW DEPENDENCY CONFLICTS WITH A PRIOR ONE...
                    var m = STACKS[d.name]
                        .map(function (y) {
                        return y.map(function (x) { return JSON.stringify(x); }).join(" > ");
                    }).join("\n  + ");
                    throw new Error("Version Conflict:\n  + " + m);
                }
                return __resolve__();
            }
            // manage the stack
            stack.splice(d.depth);
            stack.push(d);
            // get the list of available versions
            return Promise.resolve(dependency_repo.versions(d.name))
                .then(function (versions) {
                // get the maximum version satisfying the current requirement 
                var v = semver_1.maxSatisfying(versions, d.version);
                if (!v)
                    throw new Error(noSuchVersionMessage(d, versions));
                // RECORD THE VERSION
                VERSIONS[d.name] = v;
                // GATHER ANY DEPENDENCIES OF THIS VERSION
                return Promise.resolve(dependency_repo.fetch({ name: d.name, version: v }))
                    .then(function (x) {
                    var new_dependencies = x.object;
                    if (!Array.isArray(new_dependencies))
                        throw new Error("invalid dependencencies object: " + JSON.stringify(x));
                    new_dependencies.map(function (nd) {
                        if (!utils_1.is_package_loc(nd))
                            throw new Error("internal error; got an invalid package descriptor");
                        // append the depth to each new dependency
                        nd.depth = d.depth + 1;
                        // KEEP TRACK OF THE PATH TO EACH PACKAGE IMPORT
                        if (!STACKS.hasOwnProperty(nd.name))
                            STACKS[nd.name] = [];
                        STACKS[nd.name].push(stack.slice().concat(nd));
                    });
                    // append add the new dependencies to the dependencies to be determined
                    Array.prototype.unshift.apply(dependencies, new_dependencies);
                    return __resolve__();
                });
            });
        }
    }
    function noSuchVersionMessage(d, versions) {
        return "No such version \"" + d.version + "\" of package \"" + d.name + "\". Possible versions include:\n       - \"" + versions.join('"\n        - "') + "\"\n    (" + stack.map(function (x) { return JSON.stringify(x); }).join(" > ") + ")";
    }
    /*
        // synchronous implementation
        while(dependencies.length){
    
            // acuquire the next dependenciy
            var d:package_descriptor = dependencies.shift()
    
            MRO.add((d.depth > 0) ? stack[d.depth].name :"main")
    
            if(VERSIONS.hasOwnProperty(d.name) ){
                // THE VERSION OF THIS PACKAGE HAS ALREADY BEEN DETERMINED
                
                if(!satisfies(VERSIONS[d.name],d.version){
                    // THE NEW DEPENDENCY CONFLICTS WITH A PRIOR ONE...
                    var m:string =
                        STACKS[d.name].map(
                            (y:package_descriptor[][]) =>
                                (y.map( (s: package_descriptor[]) =>
                                          s.map(JSON.stringify(p))).join(" > ")).join("\n  + ")
                    throw new Error("Version Conflict:\n  + "+m)
                }
                continue;
    
            }
    
            // manage the stack
            stack.splice(d.depth); stack.push(d);
    
            // get the list of available versions
            var versions:string[] = dependency_repo.versions_sync(d.name)
    
            // get the maximum version satisfying the current requirement
            var v:string = maxSatisfying(versions,ranges_dict[name]);
            if(!v)
                throw new Error(`No such version "${d.version}" of package "${d.name}". Possible versions include:
           - "${versions.join('"\n        - "')}"
        (${stack.map(JSON.stringify).join(" > ")})`);
    
            // RECORD THE VERSION
            VERSIONS[d.name] = v;
    
            // GATHER ANY DEPENDENCIES OF THIS VERSION
            var new_dependencies:package_descriptor[] = dependency_repo.fetch_sync({name:d.name,version:v})
            for(var i = 0; i < new_dependencies.length; i++){
    
                var nd = new_dependencies[i]
    
                // append the depth to each new dependency
                nd.depth = d.depth + 1;
    
                // KEEP TRACK OF THE PATH TO EACH PACKAGE IMPORT
                if(! STACKS.hasOwnPropert(nd.name))
                    STACKS[nd.name] = []
                STACKS[nd.name].push(stack.splice().concat(nd))
            }
    
            // append add the new dependencies to the dependencies to be determined
            Array.prototype.unshift.apply(dependencies,new_dependencies)
    
        }
    
        return MRO.run().map( (name: string) => [name, VERSIONS[name]])
    
       */
}
exports.calculate_dependencies = calculate_dependencies;
/*
function maxSatisfying (versions:string[],ranges:string[]):string{

    if(!ranges.length) return null;
    
    // fast path out for a common scenario.
    if(ranges.length == 1)
        return maxSatisfying(versions, ranges[0]);

    var current_version:string,
        indx:number;

    // be polite and make a local copy of versions
    versions = versions.slice();


    while(versions.length){
        current_version =  maxSatisfying(versions, ranges[0]);
        if(ranges
             .map(function(x){satisfies(current_version,x)})
             .every(function(x:any){return !!x;}))
            // the current version is satisfactory so return it.
            return current_version;

        // the current version is somehow
        // unsatisfactory so remove it from the versions
        indx = versions.indexOf(current_version);
        versions.splice(indx,1);
    }

    // same api as semver.maxSatisfying
    return null;
}

*/
//# sourceMappingURL=version_resolution.js.map