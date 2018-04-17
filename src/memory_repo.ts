
import { 
    package_loc,
    resource_data,
    sync_repository,
    fetch_opts,
    ConfigOptions } from   "./typings";
import { 
    validate_options,
    validate_options_range } from './utils';
import { is_package_loc, ajv_is_depends_object } from './type-guards';
import * as semver from 'semver';
import { calculate_dependencies_sync } from './version_resolution';



export class MemoryRepo<T> implements sync_repository<T> {

    // insance attributes
    store:{ [x:string]:{ [x:string]:T } };
    dependencies:{ [x:string]:{ [x:string]:{ [x:string]:string } } };

    constructor(private config:ConfigOptions = {}){
        this.store = {};
        this.dependencies = {};
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
    create(options:resource_data<T>){

        // validate the options
        const loc = validate_options(options);
        if(!loc.version){
            throw new Error("Version parameter is required to create a package")
        }

        if(this.store.hasOwnProperty(loc.name)){
            // CREATE THE PACKAGE
//--             if(this.store[loc.name][loc.version]){
//--                 throw new Error(`Version ${loc.version} of package '${loc.name}' already exists`);
//--             }
            var _latest_version:string = this.latest_version(loc.name);
            if(!options.force){
                if(options.upsert){
                    if(_latest_version && semver.gt(_latest_version, loc.version))
                        throw new Error(`Version (${loc.version}) preceeds the latest version (${_latest_version})`)
                }else{
                    if(_latest_version && semver.gte(_latest_version, loc.version))
                        throw new Error(`Version (${loc.version}) does not exceed the latest version (${_latest_version})`)
                }
            }

        }else{
            // CREATE THE PACKAGE
            this.store[loc.name] = {};
            this.dependencies[loc.name] = {};
        }

        // the actual work
        this.store[loc.name][loc.version] = options.value;
        if(options.hasOwnProperty("depends"))
            this.dependencies[loc.name][loc.version] = options.depends;
        return true

    }

    depends(x:package_loc|package_loc[]|{[key: string]:string}):package_loc[]{
        if(Array.isArray(x)){
            var out =  calculate_dependencies_sync(x,this);
            return out;
        }if(is_package_loc(x)){
            var out =  calculate_dependencies_sync([x],this);
            return out;
        }else{
            if(!ajv_is_depends_object(x))
                throw Error(`Expected an object with valid names and semver strings but got error ${ ajv_is_depends_object.errors }`)
            var y:package_loc[] =  
                Object.keys(x) 
                        .filter(y => x.hasOwnProperty(y))
                        .map(y => { return {name:y,version:x[y]} })
            var out =  calculate_dependencies_sync(y,this);
            return out;
        }
    };

    fetch(query:package_loc | package_loc[],opts?:fetch_opts):resource_data<T>[]{

        if(Array.isArray(query)){
            const names = query.map(x => x.name);
            return this.depends(query)
                        .filter(x => (opts && opts.dependencies) || names.indexOf(x.name) != -1)
                        .map(x => this.fetchOne(x));
        }else if((opts && opts.dependencies)){
            return this.depends([query]).map(x => this.fetchOne(x));
        }else{
            return [this.fetchOne(query)];
        }

    }

    fetchOne(query:package_loc ,opts?:fetch_opts):resource_data<T>{

        // validate the query
        query = validate_options_range(query);

        // does the package exist?
        if(!this.store.hasOwnProperty(query.name) ||          // is there a package container
               !Object.keys(this.store[query.name]).length ){ // and are there any contents
            throw new Error("No such package: "+query.name + "versions include: " + JSON.stringify(Object.keys(this.store)));
        }

        // get the version number (key)
        if(query.version){
            var key:string = semver.maxSatisfying(Object.keys(this.store[query.name]), 
                                                    query.version);
            if(!key)
                throw new Error("No such version: "+query.version);
        } else {
            key = this.latest_version(query.name)
        }

        var out:resource_data<T> = {
                name:query.name,
                version:key
            };

        if(!(opts && opts.novalue))
                out.value = this.store[query.name][key];
        
        if(this.dependencies.hasOwnProperty(query.name) && 
                this.dependencies[query.name].hasOwnProperty(key)){
            out.depends = {};
            const deps = this.dependencies[query.name][key];
            for(let key of Object.keys(deps)){
                if(deps.hasOwnProperty(key))
                    out.depends[key] = deps[key];
            }
        }
        return out;

    }

    update(options:resource_data<T>){

        const loc = validate_options(options);
        if(this.config.update === undefined || this.config.update == "latest"){
            // validate the options
            var _latest_version:string = this.latest_version(loc.name);
            if(loc.version && !semver.eq(loc.version,_latest_version)){
                throw new Error("Only the most recent version of a package may be updated");
            }
        }else if(this.config.update == "none"){
            throw new Error("updates are disableed in this repository");
        }// else{ pass }


        // the actual work
        this.store[loc.name][_latest_version] = options.value;
        if(options.depends === undefined){
            delete this.dependencies[loc.name][_latest_version];
        }else{
            this.dependencies[loc.name][_latest_version] = options.depends;
        }

        return true;
    }

    del(options:package_loc){

        // validate the options
        const loc = validate_options(options);

        if(!this.store.hasOwnProperty(loc.name)){
            throw new Error("No such package: "+loc.name);
        }
        if(!loc.version){
            throw new Error("Version parameter is required when deleting a package")
        }
        if( !(this.store[loc.name].hasOwnProperty(loc.version))){
            throw new Error("No such version: "+loc.version);
        }



        if(this.config.update === undefined || this.config.delete == "latest"){
            // validate the options
            var _latest_version:string = this.latest_version(loc.name);
            if(loc.version && !semver.eq(loc.version,_latest_version)){
                throw new Error("Only the most recent version of a package may be deleted");
            }
        }else if(this.config.update == "none"){
            throw new Error("Deletions are disableed in this repository");
        }// else{ pass }

        // the actual work
        delete this.store[loc.name][loc.version];

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

