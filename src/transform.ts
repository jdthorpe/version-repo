
import { package_loc, resource_data, repository, deferred_repository, sync_repository } from   "./typings";

import * as Promise from "bluebird"
import * as semver from 'semver';


export class dTransform<S,T>  implements deferred_repository<T> {

    constructor(private store:repository<S>,
                private storify:{(x:T):(S|Promise<S>)},
                private destorify:{(x:S):(T|Promise<T>)}){ }

    // ------------------------------
    // CRUD
    // ------------------------------
    fetch(request:package_loc,cached_range=true):Promise<resource_data<T>>{
        var out:any;
        return (Promise.resolve(this.store.fetch(request))
                .then( (x) => {
                    out = x;
                    return Promise.resolve(this.destorify(<S>x.object))
                            .then( (y:T) => {
                                out.object = y;
                                return <resource_data<T>>out
                            });
                }))
    }

    create(request:package_loc,x:T){
        return Promise.resolve(this.storify(x)) .then((y:S) => this.store.create(request,y))
    }

    update(request:package_loc,x:T){
        return Promise.resolve(this.storify(x)) .then((y:S) => this.store.update(request,y))
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
    fetch(request:package_loc,cached_range=true):resource_data<T>{
        var x:any = this.store.fetch(request);
        x.object = this.destorify(x.object);
        return <resource_data<T>>x;
    }

    create(request:package_loc,x:T){
        return this.store.create(request,this.storify(x))
    }

    update(request:package_loc,x:T){
        return this.store.update(request,this.storify(x))
    }

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


