import { MemoryRepo } from './memory_repo';
import { ReadonlyBuffer } from "./buffer"
import { dTransform, sTransform } from "./transform"
import { calculate_dependencies } from './version_resolution';
import { isPackageLoc } from './utils';
import * as semver from 'semver';
import * as Promise from 'bluebird';


import { package_loc,
    resource_data,
    repository,
    deferred_repository,
    sync_repository,
    deferred_readable_repository,
    bare_deferred_readable_repository,
    resource_descriptor,
    fetch_opts,
    ConfigOptions } from   "./typings";

export class ProcessedBuffer<S,T> implements deferred_readable_repository<T> {

    versions_cache: {[x:string]: string[]};
    lastest_versions_cache: {[x:string]: string};
    local_store:MemoryRepo<T>;
    // an indicator that the versions cache has been popoulated by the full set of versions.
    full_versions_cache:boolean;

    constructor(public remote_store:deferred_readable_repository<S>,
                private process:{(x:S):(T|Promise<T>)},
                options:ConfigOptions|MemoryRepo<T> = new MemoryRepo()){ 
        // the local store stores promises for the resourse data
        if(options instanceof MemoryRepo){
            this.local_store = options;
        }else{
            this.local_store = new MemoryRepo<T>(options);
        }

        this.versions_cache = {};
        this.full_versions_cache = false;
        this.lastest_versions_cache = {};
    }

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

    depends(x:package_loc | package_loc[] | {[key: string]:string},cached:boolean=true):Promise<package_loc[]> {
        if(!cached)
            return this.remote_store.depends(x);// then(x =>  { it would be possible to verify the depends is consistent witht the stored value...})

        var bare_repo:bare_deferred_readable_repository = {
            fetchOne: (request:package_loc,opts?:fetch_opts) => this.fetchOne(request,{novalue:true,cached:true}),
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
    fetchOne(request:package_loc,opts?:fetch_opts):Promise<resource_data<T>>{

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
                if(opts.novalue){
                    return <Promise<resource_descriptor>>Promise.resolve(this.remote_store.fetchOne(rqst))
                }else{
                    return Promise.resolve(this.remote_store.fetchOne(rqst))
                        .then(x =>  {
                            return Promise.resolve(this.process(x.value))
                                .then(y => {
                                    this.local_store.create({
                                        name: x.name,
                                        version: x.version,
                                        value: y,
                                        depends: x.depends,
                                        force: true,
                                    })    
                                    return {
                                        name: x.name,
                                        version: x.version,
                                        value: y,
                                        depends: x.depends,
                                    }
                                })
                        })
                }
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
            return Promise.resolve(this.remote_store.packages())
                                    .then(x => {
                                            this.full_versions_cache = x.every(name => this.versions_cache.hasOwnProperty(name)) 
                                        return x;
                                    }); 
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

