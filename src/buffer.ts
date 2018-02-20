///<path ="./typings.d.ts"/>

//-- import {resource_data,deferred_repository, repository, package_loc} from "./typings"
import * as Promise from 'bluebird';
import * as semver from 'semver';

import { ProcessedBuffer } from   "./processed_buffer";
import { package_loc, resource_data, deferred_readable_repository, readable_repository } from   "./typings";


export class ReadonlyBuffer<T> extends ProcessedBuffer<T,T> implements deferred_readable_repository<T> {

    constructor(remote_store:deferred_readable_repository<T>,private options = {}){ 
        super(remote_store,x=>x,options)
    }

    fetch(request:package_loc,cached=true):Promise<resource_data<T>>{

        // ------------------------------
        // RESOLVE THE VERSION
        // ------------------------------
        var _version: Promise<string>;

        if(semver.valid(request.version)){

            // NOTHING TO DO 
            _version = Promise.resolve(request.version)

        }else if(semver.validRange(request.version)){

            // RESOLVE THE RANGE TO A SPECIFIC VERSION
            if(cached && this.versions_cache.hasOwnProperty(request.name) ){

                // RESOLVE THE VERSION USING THE CACHED VERSIONS
                var version:string = 
                    semver.maxSatisfying(
                            this.versions_cache[request.name],
                            request.version);
                _version = Promise.resolve(version)

            }else{

                // RESOLVE THE VERSION FROM VERSIONS FETCHED FROM THE SERVER
                _version = this.versions(request.name).then(
                    (versions:string[]) => {
                        // cache the versions for next time
                        this.versions_cache[request.name] = versions;
                        return semver.maxSatisfying( versions, request.version);
                    });

            }

        }else if(!request.version || request.version === 'latest'){

            if(cached && this.lastest_versions_cache.hasOwnProperty(request.name) ){
                _version = Promise.resolve(this.lastest_versions_cache[request.name])
            }else{
                _version = this.latest_version(request.name).then( (version)  => {
                    // cache the versions for next time
                    this.lastest_versions_cache[request.name] = version;
                    return version;
                })  
            }

        } else {

            // invalid 
            _version = Promise.reject(Error(`No such version "${request.version}" for module "${request.version}"`))

        }

        return _version.then( (version:string) => {

            const rqst:package_loc = {name: request.name, version: version}
            try{
                // RETURN THE LOCALLY STORED VERSION, if available
                return Promise.resolve(this.local_store.fetch(rqst));
            } catch (err) {
                return Promise.resolve(this.remote_store.fetch(rqst))
                    .then(x => {
                        this.local_store.create(rqst,x.object);
                        return x;
                    });

            } 
        })
    }

}

