
import { package_loc, resource_data, sync_repository } from   "./typings";
import {validate_options,validate_options_range} from './utils';
import * as semver from 'semver';

export class MemoryRepo<T> implements sync_repository<T> {

    // insance attributes
    store:{ [x:string]:{ [x:string]:T } };

    constructor(private options:{single_version?:boolean} = {}){
        this.store = {};
    }

    // connection
    connect(){
        return true;
    }

    is_connected(){
        return true;
    }

    // ------------------------------
    // CRUD
    // ------------------------------
    create(options:package_loc,pkg:T){

        if(this.options.single_version && this.store.hasOwnProperty(options.name)){
            throw new Error(`Duplicate definition of library (${options.name}) in single version repository.`);
        }

        // validate the options
        options = validate_options(options);
        if(!options.version){
            throw new Error("Version parameter is required to create a package")
        }

        if(this.store.hasOwnProperty(options.name)){
            // CREATE THE PACKAGE
//--             if(this.store[options.name][options.version]){
//--                 throw new Error(`Version ${options.version} of package '${options.name}' already exists`);
//--             }
            var _latest_version:string = this.latest_version(options.name);
            if(options.upsert){
                if(_latest_version && semver.gt(_latest_version, options.version))
                    throw new Error(`Version (${options.version}) preceeds the latest version (${_latest_version})`)
            }else{
                if(_latest_version && semver.gte(_latest_version, options.version))
                    throw new Error(`Version (${options.version}) does not exceed the latest version (${_latest_version})`)
            }

        }else{
            // CREATE THE PACKAGE
            this.store[options.name] = {};
        }

        // the actual work
        this.store[options.name][options.version] = pkg;
        return true

    }

    fetch(options:package_loc){

        // validate the options
        options = validate_options_range(options);

        // does the package exist?
        if(!this.store.hasOwnProperty(options.name) ||          // is there a package container
               !Object.keys(this.store[options.name]).length ){ // and are there any contents
            throw new Error("No such package: "+options.name);
        }

        // get the version number (key)
        if(options.version){
            var key:string = semver.maxSatisfying(Object.keys(this.store[options.name]), 
                                                    options.version);
            if(!key)
                throw new Error("No such version: "+options.version);
        } else {
            key = this.latest_version(options.name)
        }

        return {
                name:options.name,
                version:key,
                object: this.store[options.name][key],
            };

    }

    update(options:package_loc,pkg:T){

        // validate the options
        options = validate_options(options);
        var _latest_version:string = this.latest_version(options.name);
        if(options.version && 
                !semver.eq(options.version,_latest_version)){
            throw new Error("Only the most recent version of a package may be updated");
        }

        // the actual work
        this.store[options.name][_latest_version] = pkg;

        return true;
    }

    del(options:package_loc){

        // validate the options
        options = validate_options(options);

        if(!this.store.hasOwnProperty(options.name)){
            throw new Error("No such package: "+options.name);
        }
        if(!options.version){
            throw new Error("Version parameter is required when deleting a package")
        }
        if( !(this.store[options.name][options.version])){
            throw new Error("No such version: "+options.version);
        }

        // the actual work
        delete this.store[options.name][options.version];

        return true;
    }

    exists(name:string){
        return this.store[name] !== undefined;
    }

    latest_version(name:string){
        if(this.store[name])
            return <string>(semver.maxSatisfying(Object.keys(this.store[name]),'>=0.0.0'));
        else 
            return null;
    }

    // return a list of available packages
    packages ():string[] {
        var out = Object.keys(this.store);
        for(var i:number = out.length; i>0  ;i-- )
            if(!Object.keys(this.store[out[i-1]]).length)
                out.splice(i-1,1);
        return out;
    }

    // return a list of available versions for a package
    versions():{[x:string]:string[]};
    versions(name:string):string[];
    versions(name?:string):any{
        if(typeof name === 'undefined'){
            var out:{[x:string]:string[]} = {};
            for(var name in this.store){
                if(!this.store.hasOwnProperty(name)){ continue; }
                out[name] = Object.keys(this.store[name]);
            }
            return out;
        }else{
            if(!this.store.hasOwnProperty(name)){
                throw new Error('No such package: '+name);
            }
            return Object.keys(this.store[name]);
        }
    }

}

