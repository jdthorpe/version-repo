///<path ="./typings.d.ts"/>

//-- import {resource_data,deferred_repository, repository, package_loc} from "./typings"
import {MemoryRepo} from './memory_repo';
import * as Promise from 'bluebird';
import * as semver from 'semver';

import {//validate_options,
    //validate_options_range, 
    isPackageLoc} from './utils';
import { calculate_dependencies } from './version_resolution';
//-- import { ProcessedBuffer } from   "./processed_buffer";
import { package_loc, resource_data,bare_deferred_readable_repository, deferred_readable_repository, readable_repository, fetch_opts } from   "./typings";

//--     fetch(x:package_loc|package_loc[],fetch_opts?:fetch_opts):resource_data<T>[];
//--     fetchOne(x:package_loc,opts?:fetch_opts):resource_data<T>;


export class ReadonlyBuffer<T> implements deferred_readable_repository<T> { 

    versions_cache: {[x:string]: string[]};
    lastest_versions_cache: {[x:string]: string};
    local_store:MemoryRepo<T>;
    // an indicator that the versions cache has been popoulated by the full set of versions.
    full_versions_cache:boolean;

    constructor(public remote_store:deferred_readable_repository<T>,
                options = {}){ 
        // the local store stores promises for the resourse data
        this.local_store = new MemoryRepo<T>(options);

        this.versions_cache = {};
        this.full_versions_cache = false;
        this.lastest_versions_cache = {};
    }

    fetch(query:package_loc,opts?:fetch_opts):Promise<resource_data<T>[]>;
    fetch(query:package_loc[],opts?:fetch_opts):Promise<resource_data<T>[]>;
    fetch(query:package_loc[]|package_loc,opts?:fetch_opts):Promise<resource_data<T>[]>{

        if(Array.isArray(query)){

            const names = query.map(x => x.name);
            return this.depends(query,opts.cached)
                    .then(pkgs => 
                            Promise.all(pkgs
                                        .filter(x => (opts && opts.dependencies) || names.indexOf(x.name) != -1)
                                        .map(pkg => this.fetchOne(pkg,opts)))
                    )

        }else if(opts && opts.dependencies){
            return this.depends([query],opts.cached)
                    .then(pkgs => 
                            Promise.all(pkgs
                                        .map(x => this.fetchOne(x,opts))));
        }else{
            return this.fetchOne(query,opts).then(x => [x]);
        }
    }

    depends(x:package_loc,cached):Promise<package_loc[]>;
    depends(x:package_loc[],cached):Promise<package_loc[]>;
    depends(x:{[key: string]:string},cached):Promise<package_loc[]>;
    depends(x,cached:true){
        if(!cached)
            return this.remote_store.depends(x);// then(x =>  { it would be possible to verify the depends is consistent witht the stored value...})

        var bare_repo:bare_deferred_readable_repository = {
            fetchOne: (request:package_loc,opts:fetch_opts) => this.fetchOne(request,{novalue:true,cached:true}),
            versions: (name:string) => this.versions(name,true)
        }

        if(Array.isArray(x)){
            return calculate_dependencies(x,bare_repo);
        }if(isPackageLoc(x)){
            return calculate_dependencies([x],bare_repo);
        }else{
            var y:package_loc[] =  
                Object.keys(x) 
                        .filter(y => x.hasOwnProperty(y))
                        .map(y => { return {name:y,version:x[y]} })
            return calculate_dependencies(y,bare_repo);
        }
    };


    // TODO: opts:fetch_opts could have it's type narrowed to just {cached:boolean}, I think
    fetchOne(request:package_loc,opts:fetch_opts):Promise<resource_data<T>>{

        // ------------------------------
        // RESOLVE THE VERSION
        // ------------------------------
        var _version: Promise<string>;

        if(!request.version || request.version === 'latest'){
            // THE 'LATEST' VERSION HAS BEEN REQUESTED

            if( opts.cached && this.lastest_versions_cache.hasOwnProperty(request.name) ){

                _version = Promise.resolve(this.lastest_versions_cache[request.name])

            }else{

                _version = this.latest_version(request.name).then( (version)  => {
                    // cache the versions for next time
                    this.lastest_versions_cache[request.name] = version;
                    return version;
                })  

            }

        }else if(semver.valid(request.version)){

            // NOTHING TO DO 
            _version = Promise.resolve(request.version)

        }else if(semver.validRange(request.version)){

            // RESOLVE THE RANGE TO A SPECIFIC VERSION
            if( opts.cached && this.versions_cache.hasOwnProperty(request.name) ){

                // RESOLVE THE VERSION USING THE CACHED VERSIONS
                var version:string = 
                    semver.maxSatisfying(
                            this.versions_cache[request.name],
                            request.version);
                _version = Promise.resolve(version)

            }else{

                // RESOLVE THE VERSION FROM VERSIONS FETCHED FROM THE SERVER
                _version = this.versions(request.name,opts.cached).then(
                    (versions:string[]) => {
                        // cache the versions for next time
                        this.versions_cache[request.name] = versions;
                        return semver.maxSatisfying( versions, request.version);
                    });

            }

        } else {

            // invalid 
            _version = Promise.reject(Error(`No such version "${request.version}" for module "${request.version}"`))

        }

        return _version.then( (version:string) => {

            const rqst:package_loc = {name: request.name, version: version}
            try{
                // RETURN THE LOCALLY STORED VERSION, if available
                return Promise.resolve(this.local_store.fetchOne(rqst));
            } catch (err) {
                return Promise.resolve(this.remote_store.fetchOne(rqst))
                    .then(x => {
                        if(!opts.novalue) {
                            // only store the object if the value was also included in the returned value...
                            this.local_store.create({
                                name: x.name,
                                version: x.version,
                                value: x.value,
                                depends: x.depends,
                                force: true,
                            });
                        }
                        return x;
                    });

            } 
        })
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
        return this.local_store.versions(name); 
    }

    packages (cached=true){ 
        if(cached && !name && this.full_versions_cache){
            return Promise.resolve(Object.keys(this.versions_cache)
                                    .filter(x => this.versions_cache.hasOwnProperty(x))); 
        } else{
            return Promise.resolve(this.remote_store.packages()
                                    .then(x => {
                                            this.full_versions_cache = x.every(name => this.versions_cache.hasOwnProperty(name)) 
                                        return x;
                                    })); 
        }
    }

    versions():Promise<{[x:string]:string[]}>;
    versions(name:string):Promise<string[]>;
    versions(name:string,cached:boolean):Promise<string[]>;
    versions(name?:string,cached=true):Promise<{[x:string]:string[]}> | Promise<string[]>{ 
        // param: Cached If true, return the cached set of versions if a local
        //        set of versoins were stored, else fetch them from the remote
        //        and store the returned value.  In short cached will be a bit faster but could be out of date

        if(cached && name && this.versions_cache.hasOwnProperty(name) ){

            return Promise.resolve(this.versions_cache[name].slice()); 

        }else if(cached && !name && this.full_versions_cache){

            var out:{[x:string]:string[]} = {};
            for(let key in Object.keys(this.versions_cache)){
                if(this.versions_cache.hasOwnProperty(key))
                    out[key] = this.versions_cache[key].slice()
            }
            return Promise.resolve(out); 

        }else if(name){

            return Promise.resolve(this.remote_store.versions(name))
                .then( x => {
                        this.versions_cache[name] = x.slice();
                        return x;
                }); 

        }else{

            return Promise.resolve(this.remote_store.versions())
                .then( x => {

                        this.versions_cache = {};
                        for(let key in Object.keys(x)){
                            if(x.hasOwnProperty(key))
                                this.versions_cache[key] = x[key].slice()
                        }
                        this.full_versions_cache = true;
                        return x;
                }); 

        }
    }

}

