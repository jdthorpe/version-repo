
import { package_loc, bare_deferred_readable_repository, sync_readable_repository } from   "./typings";
import { maxSatisfying, satisfies } from 'semver';

import { is_package_loc } from "./utils"

//-- import * as Q from 'q';
import * as Promise from 'bluebird';
import c3 from "./c3"

// Strategy: 
// Resolve versions immediately; don't be cute about trying to winnow down 
// the versions gradually to allow for greater chance of successfully
// identifying a 'valid' set of requirments; keep track of requirements
// so sources of confilcts are easily found.

interface package_descriptor {
    name:string;
    version:string;
    depth?:number;
}

export function calculate_dependencies  (
        // versions is a dictionary with the where each key correspondes to a
        // dependency name, and each value is a string or vector of strings with 
        // the available versions for that key
        x: package_loc[],
        repo:bare_deferred_readable_repository,
        ):Promise<package_loc[]>
{

    if(!x.every(is_package_loc))
        throw new Error("x is not an array of package locations")
    if(repo===undefined)
        throw new Error("missing repo");

    var VERSIONS:{[name:string]:string} = {}
    var MRO = c3("main")

    // a graph of require statements for determinig sources of conflict
    var STACKS: { [x:string]: package_descriptor[][] } = {};
    var stack:package_descriptor[] = []

    var dependencies:package_descriptor[] = x.map(
        (y:package_loc) =>  { 
            return {name: y.name,
            version: y.version,
            depth: 0,
            }
        })

    return __resolve__();

    function __resolve__():Promise<package_loc[]>{

        if(dependencies.length === 0){

            // We're done! (whew, that was easy).
            return new Promise((resolve,reject)=>{

                try{
                    //formerly: MRO.run().map( (name: string) => {
                    const out = MRO.run().slice(1).map( (name: string) => {
                        //console.log(JSON.stringify({ name:name, version:VERSIONS[name] },null,4))
                        return {
                            name:name, 
                            version:VERSIONS[name]
                        }
                    })
                    resolve(out);
                }catch(err){
                    reject(err);
                }

            })

        }else{

            // acuquire the next dependenciy
            var d:package_descriptor = dependencies.shift()

            MRO.add( (d.depth > 0) ? stack[d.depth-1].name :"main", d.name)

            if(VERSIONS.hasOwnProperty(d.name) ){
                // THE VERSION OF THIS PACKAGE HAS ALREADY BEEN DETERMINED
                
                if(!satisfies(VERSIONS[d.name],d.version)){
                    // THE NEW DEPENDENCY CONFLICTS WITH A PRIOR ONE...
                    var m:string = 
                        STACKS[d.name]
                            .map( (y:package_descriptor[]) => 
                                   y.map(x => JSON.stringify(x)).join(" > ")).join("\n  + ");
                    throw new Error("Version Conflict:\n  + "+m)
                }
                return __resolve__();

            }

            // manage the stack
            stack.splice(d.depth); stack.push(d);

            // get the list of available versions
            return Promise.resolve(repo.versions(d.name))
                .then( (versions:string[]) => {

                    // get the maximum version satisfying the current requirement 
                    var v:string = maxSatisfying(versions,d.version);
                    if(!v) 
                        throw new Error(noSuchVersionMessage(d,versions));

                    // RECORD THE VERSION
                    VERSIONS[d.name] = v;

                    // GATHER ANY DEPENDENCIES OF THIS VERSION
                    return Promise.resolve(repo.fetchOne({name:d.name,version:v},{novalue:true}))
                            .then( x => {
                                if(!x.depends) // formerly x.hasOwnProperty("depends")
                                    // nothing to do.
                                    return __resolve__();

                                var depends = x.depends;

                                var new_dependencies:package_descriptor[] = Object.keys(depends)
                                    .filter(k => depends.hasOwnProperty(k))
                                    .map(k => {return {
                                                        name:k,
                                                        version:depends[k]
                                                      };
                                            })

                                new_dependencies.map( (nd:package_descriptor) => {

                                    if(!is_package_loc(nd))
                                        throw new Error(`internal error; got an invalid package descriptor: ${JSON.stringify(nd)}`)

                                    // append the depth to each new dependency
                                    nd.depth = d.depth + 1;

                                    // KEEP TRACK OF THE PATH TO EACH PACKAGE IMPORT
                                    if(! STACKS.hasOwnProperty(nd.name))
                                        STACKS[nd.name] = []
                                    STACKS[nd.name].push(stack.slice().concat(nd))

                                })

                                // append add the new dependencies to the dependencies to be determined
                                Array.prototype.unshift.apply(dependencies,new_dependencies)

                                return __resolve__();
                            })
            })
        }
    }

    // this needs to live where `stack` is in scope...
    function noSuchVersionMessage(d:package_loc,versions:string[]){
        return `No such version "${d.version}" of package "${d.name}". Possible versions include:
       - "${versions.join('"\n        - "')}"
    (${stack.map(x => JSON.stringify(x)).join(" > ")})`;
    }
}

export function calculate_dependencies_sync  (
        // versions is a dictionary with the where each key correspondes to a
        // dependency name, and each value is a string or vector of strings with 
        // the available versions for that key
        x: package_loc[],
        repo:sync_readable_repository<any>,
        ):package_loc[]
{

    if(!x.every(is_package_loc))
        throw new Error("x is not an array of package locations")
    if(repo===undefined)
        throw new Error("missing repo");

    var VERSIONS:{[name:string]:string} = {}
    var MRO = c3("main")

    // a graph of require statements for determinig sources of conflict
    var STACKS: { [x:string]: package_descriptor[][] } = {};
    var stack:package_descriptor[] = []

    var dependencies:package_descriptor[] = x.map(
        (y:package_loc) =>  { 
            return {name: y.name,
            version: y.version,
            depth: 0,
            }
        })


    // synchronous implementation
    while(dependencies.length){

        // acuquire the next dependenciy
        var d:package_descriptor = dependencies.shift()

        MRO.add((d.depth > 0) ? stack[d.depth - 1].name :"main",d.name)

        if(VERSIONS.hasOwnProperty(d.name) ){
            // THE VERSION OF THIS PACKAGE HAS ALREADY BEEN DETERMINED
            
            if(!satisfies(VERSIONS[d.name],d.version)){
                // THE NEW DEPENDENCY CONFLICTS WITH A PRIOR ONE...
                var m:string = 
                    STACKS[d.name]
                    .map( (y:package_descriptor[]) => 
                                   y.map(x => JSON.stringify(x)).join(" > ")).join("\n  + ")
                throw new Error("Version Conflict:\n  + "+m)
            }
            continue;

        }

        // manage the stack
        stack.splice(d.depth); stack.push(d);

        // get the list of available versions
        var versions:string[] = repo.versions(d.name)

        // get the maximum version satisfying the current requirement 
        var v:string = maxSatisfying(versions,d.version);
        if(!v) 
             throw new Error(noSuchVersionMessage(d,versions));

        // RECORD THE VERSION
        VERSIONS[d.name] = v;

        const obj = repo.fetchOne({name:d.name,version:v},{novalue:true});
        if(! obj.depends ) // formerly !obj.hasOwnProperty("depends")
            continue;
        var depends = obj.depends;

        // GATHER ANY DEPENDENCIES OF THIS VERSION
        var new_dependencies:package_descriptor[] = Object.keys(depends)
            .filter(k => depends.hasOwnProperty(k))
            .map(k => {return {
                                name:k,
                                version:depends[k]
                              };
                    });

        new_dependencies.map( (nd:package_descriptor) => {

            if(!is_package_loc(nd))
                throw new Error("internal error; got an invalid package descriptor")

            // append the depth to each new dependency
            nd.depth = d.depth + 1;

            // KEEP TRACK OF THE PATH TO EACH PACKAGE IMPORT
            if(! STACKS.hasOwnProperty(nd.name))
                STACKS[nd.name] = []
            STACKS[nd.name].push(stack.slice().concat(nd))

        });

        // append add the new dependencies to the dependencies to be determined
        Array.prototype.unshift.apply(dependencies,new_dependencies);

    }

    return MRO.run().slice(1).map( (name: string) => {
                    return {
                        name:name, 
                        version:VERSIONS[name]
                    }
                });

    // this needs to live where `stack` is in scope...
    function noSuchVersionMessage(d:package_loc,versions:string[]){
        return `No such version "${d.version}" of package "${d.name}". Possible versions include:
       - "${versions.join('"\n        - "')}"
    (${stack.map(x => JSON.stringify(x)).join(" > ")})`;
    }
}

