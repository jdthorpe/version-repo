
import { package_loc, resource_data, repository, deferred_repository, sync_repository, fetch_opts } from   "./typings";

import * as Promise from "bluebird"
import * as semver from 'semver';
import { calculate_dependencies_sync } from './version_resolution';
import { isPackageLoc } from './utils';




export class dTransform<S,T>  implements deferred_repository<T> {

    constructor(private store:repository<S>,
                private storify:{(x:T):(S|Promise<S>)},
                private destorify:{(x:S):(T|Promise<T>)}){ }

    // ------------------------------
    // CRUD
    // ------------------------------

    create(options:resource_data<T>){
        return Promise.resolve(this.storify(options.value))
            .then((y:S) => {
                
                var obj:resource_data<S> = {
                    name:options.name,
                    version:options.version,
                    upsert:options.upsert,
                    value:y,
                };
                if(options.hasOwnProperty("depends"))
                    obj.depends = options.depends;
                return this.store.create(obj);
            })
    }

    update(options:resource_data<T>){
        return Promise.resolve(this.storify(options.value)) 
            .then((y:S) => {
                
                var obj:resource_data<S> = {
                    name:options.name,
                    version:options.version,
                    upsert:options.upsert,
                    value:y,
                };
                if(options.hasOwnProperty("depends"))
                    obj.depends = options.depends;
                return this.store.update(obj);
            });
    }

    fetch(query:package_loc|package_loc[],opts?:fetch_opts):Promise<resource_data<T>[]>{
        if((!!opts) && !!opts.novalue){
            var out:Promise<resource_data<any>[]> = Promise.resolve(this.store.fetch(query,opts));
            return (<Promise<resource_data<T>[]>>out);
        }
        return Promise.resolve(this.store.fetch(<package_loc[]>query,opts))
                .then( x => 
                        Promise.all(x.map(r => Promise.resolve(this.destorify(<S>r.value))
                                                        .then(z => {
                                                            var out:resource_data<T> = {name:r.name,version:r.version, value:z};
                                                            if(r.hasOwnProperty("depends"))
                                                                out.depends = r.depends
                                                            return out}))));
    }

    fetchOne(query,opts?:fetch_opts){
        if((!!opts) && !!opts.novalue){
            var out:Promise<resource_data<any>> = Promise.resolve(this.store.fetchOne(query,opts));
            return (<Promise<resource_data<T>>>out);
        }
        return Promise.resolve(this.store.fetchOne(query,opts))
                        .then(x => Promise.resolve(this.destorify(<S>x.value))
                                            .then(val => {
                                                        var out:resource_data<T> =  {
                                                            name: x.name,
                                                            version: x.version,
                                                            value: val,
                                                        };
                                                        if(x.hasOwnProperty("depends")) out.depends = x.depends;
                                                    return out;
                                            }));
    }

    depends(x:package_loc):Promise<package_loc[]>;
    depends(x:package_loc[]):Promise<package_loc[]>;
    depends(x:{[key: string]:string}):Promise<package_loc[]>;
    depends(x:any):Promise<package_loc[]>{
        return Promise.resolve(this.store.depends(x));
    }

    del(request:package_loc){
        return Promise.resolve(this.store.del(request))
    }

    // ------------------------------
    // ENUMERATION (defer to the remote)
    // ------------------------------
    latest_version(name:string){ 
        return Promise.resolve(this.store.latest_version(name)); 
    }

    packages (){ 
        return Promise.resolve(this.store.packages());
    }

    versions():Promise<{[x:string]:string[]}>;
    versions(name:string):Promise<string[]>;
    versions(name?:string):Promise<{[x:string]:string[]}> | Promise<string[]>{ 
        return Promise.resolve(this.store.versions(name))
    }

}


export class sTransform<S,T>  implements sync_repository<T> {

    constructor(private store:sync_repository<S>,
                private storify:{(x:T):S},
                private destorify:{(x:S):T}){ }

    // ------------------------------
    // CRUD
    // ------------------------------

    create(options:resource_data<T>){
        var val:resource_data<S> = {
            name:options.name,
            version:options.version,
            upsert:options.upsert,
            value:this.storify(options.value),
        }
        if(options.hasOwnProperty("depends"))
            val.depends = options.depends;
        return this.store.create(val);
    }

    update(options:resource_data<T>){
        var val:resource_data<S> = {
            name:options.name,
            version:options.version,
            upsert:options.upsert,
            value:this.storify(options.value),
        }
        if(options.hasOwnProperty("depends"))
            val.depends = options.depends;
        return this.store.update(val);
    }


    fetch(query:package_loc|package_loc[],opts?:fetch_opts):resource_data<T>[]{
        return this.store.fetch(query,opts)
                    .map(x => {
                            var out:resource_data<T> = {
                                name:x.name,
                                version:x.version,
                            };
                            if((!opts) || !opts.novalue)
                                out.value = this.destorify(x.value);
                            if(x.hasOwnProperty("depends"))
                                out.depends = x.depends
                            return out
                    });
    }

    fetchOne(query:package_loc ,opts?:fetch_opts):resource_data<T>{
        const x = this.store.fetchOne(query,opts);
        var out:resource_data<T> = {
            name:x.name,
            version:x.version,
        };
        if((!opts) || !opts.novalue)
            out.value = this.destorify(x.value);
        if(x.hasOwnProperty("depends")) out.depends = x.depends;
        return out;
    }

    depends(x:package_loc):package_loc[];
    depends(x:package_loc[]):package_loc[];
    depends(x:{[key: string]:string}):package_loc[];
    depends(x){
        if(Array.isArray(x)){
            return calculate_dependencies_sync(x,this);
        }if(isPackageLoc(x)){
            return calculate_dependencies_sync([x],this);
        }else{
            var y:package_loc[] =  
                Object.keys(x) 
                        .filter(y => x.hasOwnProperty(y))
                        .map(y => { return {name:y,version:x[y]} })
            return calculate_dependencies_sync(y,this);
        }
    };

    del(request:package_loc){
        return this.store.del(request)
    }

    // ------------------------------
    // ENUMERATION (defer to the remote)
    // ------------------------------
    latest_version(name:string){ 
        return this.store.latest_version(name); 
    }

    packages (){ 
        return this.store.packages();
    }

    versions():{[x:string]:string[]};
    versions(name:string):string[];
    versions(name?:string): ( {[x:string]:string[]} | string[] ){ 
        return this.store.versions(name)
    }

}


