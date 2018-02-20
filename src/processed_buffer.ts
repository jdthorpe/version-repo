
import { package_loc, resource_data, deferred_readable_repository } from   "./typings";

import {MemoryRepo} from './memory_repo';
import * as Promise from 'bluebird';
import * as semver from 'semver';


export class ProcessedBuffer<S,T>  implements deferred_readable_repository<T> {

    // insance attributes
    local_store:MemoryRepo<T>;

    versions_cache: {[x:string]: string[]};
    full_versions_cache:boolean;
    lastest_versions_cache: {[x:string]: string};
    fetch_queue:Promise<resource_data<T>>[];

    constructor(public remote_store:deferred_readable_repository<S>,
                public processor:{(x:S):(T|Promise<T>)},
                options = {}){ 
        // the local store stores promises for the resourse data
        this.local_store = new MemoryRepo<T>(options);
        this.fetch_queue = [];

        this.versions_cache = {};
        this.full_versions_cache = false;
        this.lastest_versions_cache = {};
    }

    // ------------------------------
    // a buffer only method
    // ------------------------------
    // THE ONLY REAL METHOD FOR THIS CLASS
    fetch_sync(request:package_loc):resource_data<T>{

        if(semver.validRange(request.version) && ! semver.valid(request.version)){
            // RANGE BASED REQUEST 
            if( ! (request.name in  this.versions_cache)){
                throw new Error(`Range based Fetch_Sync of package with un-cached version: ${JSON.stringify(request)}`)
            }
            var version:string = 
                semver.maxSatisfying(
                        this.versions_cache[request.name],
                        request.version);
            if(!version){
                throw new Error(`No version satisfying "${request.version}" for module "${request.version}"`);
            }
            request.version = request.version;
        }
        return this.local_store.fetch(request);
    }

    // ------------------------------
    // CRUD
    // ------------------------------
    // THE ONLY REAL METHOD FOR THIS CLASS
    fetch(request:package_loc,cached_range=true):Promise<resource_data<T>>{

        try{

            // RETURN THE LOCALLY STORED VERSION, if available
            return Promise.resolve(this.local_store.fetch(request));

        } catch (err) {

            var raw_data:resource_data<S> ;
            var out:resource_data<T> ;
            // FETCH THE ITEM
            return  Promise.resolve(this.remote_store.fetch(request))
                .then( (x:resource_data<S>) => {
                    raw_data = x;
                    return Promise.resolve<T>(this.processor(x.object))
                })
                .then( (x:T) => {
                    this.local_store.create({
                            name:raw_data.name,
                            version:raw_data.version,
                        },
                        x);
                    return {
                            name:raw_data.name,
                            version:raw_data.version,
                            object:x,
                        };
                })
        } 

    }

    create(request:package_loc,pkg:T){
        return Promise.reject(Error('Cannot create a record in a read-only buffer'));
    }

    update(request:package_loc,pkg:T){
        return Promise.reject(Error('Cannot update a record in a read-only buffer'));
    }

    del(request:package_loc){
        return Promise.reject(Error('Cannot delete a record in a read-only buffer'));
    }

    // ------------------------------
    // SUGAR / CRUFT
    // ------------------------------
    // defer to the remote
//--     resolve_versions(request){ return this.remote_store.resolve_versions(request); }

    // ------------------------------
    // ENUMERATION (defer to the remote)
    // ------------------------------
    latest_version(name:string,cached=true){ 
        if(cached && name in this.lastest_versions_cache ){
            return Promise.resolve(this.lastest_versions_cache[name]); 
        }else{
            
            return Promise.resolve(this.remote_store.latest_version(name)); 
        }
    }

    versions_sync():{[x:string]:string[]};
    versions_sync(name:string):string[];
    versions_sync(name?:string):any{
        return Promise.resolve(this.local_store.versions()); 
    }

    packages (){ 
        return Promise.resolve(this.remote_store.packages()); 
    }

    versions():Promise<{[x:string]:string[]}>;
    versions(name:string):Promise<string[]>;
    versions(name?:string,cached=true):Promise<{[x:string]:string[]}> | Promise<string[]>{ 
        if(cached && name && name in this.versions_cache ){
            return Promise.resolve(this.versions_cache[name]); 
        }else if(cached && !name && this.full_versions_cache){
            return Promise.resolve(this.versions_cache); 
        }else if(name){
            return Promise.resolve(this.remote_store.versions(name))
                .then( x => {
                        this.versions_cache[name] = x;
                        return x;
                }); 
        }else{
            return Promise.resolve(this.remote_store.versions())
                .then( x => {
                        this.versions_cache = x;
                        this.full_versions_cache = true;
                        return x;
                }); 
        }
    }

}


