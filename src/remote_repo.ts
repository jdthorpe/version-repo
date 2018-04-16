
import * as request from 'superagent-bluebird-promise';
import * as Promise from 'bluebird';
import * as semver from 'semver';

import { deferred_repository, remote_repo_config, package_loc, resource_data, fetch_opts } from "./typings"
import { validate_options, validate_options_range } from './utils';

const trailing_slash = /\/$/;
const leading_slash = /^\//;

export class RemoteRepo<T> implements deferred_repository<T> {

    //constructor(public base_url:string){ }
    base_url:string;

    constructor(public params:remote_repo_config){
        this.base_url = !!params.base_url?params.base_url: "";
    }
    // ------------------------------
    // CRUD
    // ------------------------------

    create(options:resource_data<T>){

        // validate the options
        return new Promise((resolve) => {
            resolve(validate_options(options))
        })
        .then( (loc:package_loc)  => {
            return request.post( this._build_url(loc))
            .send({
                value:options.value,
                depends:options.depends
            })
            .then(function (response) {
                return true;
            })
            .catch((err) => {// the full response object
                if(err.body && err.body.error && err.body.error !== undefined)
                    throw new Error( err.body.error); // the full response object
                throw new Error(err); // the full response object
            });
        })
    }

    update(options:resource_data<T>){

        return new Promise((resolve) => {
            resolve(validate_options(options))
        })
        .then( (loc:package_loc )  =>  {
            return request.put( this._build_url(loc))
                .send({value:options.value,depends:options.depends})
                .then((response) =>  {
                    return true;
                })
                .catch((err) =>  {
                    if(err.body && err.body.error && err.body.error !== undefined)
                        throw new Error( err.body.error); // the full response object
                    throw new Error(err); // the full response object
                });
        })
    }

    del(options:package_loc){

        return new Promise((resolve) => {
            resolve(validate_options(options))
        })
        .then( (loc:package_loc)  => {
            return request.del( this._build_url(loc))
                .then((response) => {
                    return true;
                })
                .catch((err) =>  {
                    if(err.body && err.body.error && err.body.error !== undefined)
                        throw new Error( err.body.error); // the full response object
                    throw new Error(err); // the full response object
                });
        })
    }

    depends(x:package_loc|package_loc[]|{[key: string]:string}):Promise<package_loc[]>{

        return request.get( this.base_url.replace(trailing_slash,"")+"/")
                .send({method:"depends",args: [x]})
                .then((response) => {
                    if(! response.body){
                        throw new Error("No response body.")
                    }
                    return response.body;
                })
                .catch((err)  => {
                    if(err.body && err.body.error && err.body.error !== undefined)
                        throw new Error( err.body.error); // the full response object
                    throw new Error(err); // the full response object
                });
    }

    fetch(query:package_loc|package_loc[],opts?:fetch_opts):Promise<resource_data<T>[]>{

        return request.get( this.base_url.replace(trailing_slash,"")+"/")
                .send({method:"fetch",args: [query,opts]})
                .then((response) => {
                    if(! response.body){
                        throw new Error("No response body.")
                    }
                    //if(! response.body.value) throw new Error("Request failed to return the `value` attribute.")
                    return response.body;
                })
                .catch((err)  => {
                    if(err.body && err.body.error)
                        throw new Error( err.body.error); // the full response object
                    throw err
                });
    }


    fetchOne(query:package_loc,opts?:fetch_opts){
        return Promise.resolve( validate_options_range(query))
            .then( (options:package_loc)  => {
                return request.get( this._build_url(options))
                        .send({method:"fetchOne",args: [options,opts]})
                        .then((response) => {
                            if(! response.body.contents){
                                throw new Error("Request failed to return the `contents` attribute.")
                            }
                            const contents:resource_data<T>  = response.body.contents
                            if(options.name !== contents.name){
                                throw new Error(`'response.contents.name' (${contents.name}) differes from the requested resource name (${options.name}).`)
                            }
                            if(typeof options.version === 'string' &&  
                               !semver.satisfies(contents.version,options.version)){
                                throw new Error(`'response.contents.version' (${contents.version}) does not match the requested version (${options.version}).`)
                            }
                            return contents;
                        })
                        .catch((err)  => {
                            if(err.body && err.body.error)
                                throw new Error( err.body.error); // the full response object
                            throw err
                        });
            })

    }

    resolve_versions(versions:{[x:string]:string}){

        return request.get( this._build_url({name:'resolve'}))
            .query(versions)
            .then((response) =>  {
                return response.body;
            })
            .catch((err) =>  {
                if(err.body && err.body.error)
                    throw new Error( err.body.error); // the full response object
                throw err
            });

    }

    // ------------------------------
    // ENUMERATION
    // ------------------------------
    latest_version(name:string){

        return request.get( this._build_url({name:name,version:'latest_version'}))
            .then((response) =>  {
                return response.body;
            })
            .catch((err) =>  {
                throw new Error( `Failed to fetch latest version for packages:  ${name} with message ${err.text}`); // the full response object
            });

    }

    // return a list of available packages
    packages () {

        return request.get(this._build_url({name:"/"}))
            .set('Accept', 'application/json')
            .then((res) =>  {
                return res.body;
            })
            .catch((err) =>  {
                throw new Error( "Failed to acquire package"); // the full response object
            });

    }

    // return a list of available versions for a packages
    versions():Promise<{[x:string]:string[]}>;
    versions(name:string):Promise<string[]>;
    versions(name?:string):any{


        // TODO: I'm just not sure how well this plan was thought through.
        var url_object:package_loc = (typeof name === 'undefined')?
            {name:"versions"}:
            {name:name,version:"versions"};

        return request
            .get( this._build_url(url_object))
            .then((response) =>  { return response.body; })
            .catch((err) =>  {
                throw new Error( `Failed to acquire versions for package ${name} with message ${err.text}`); 
            });

    }

    // ------------------------------
    // UTILITIES
    // ------------------------------
    _build_url(options:package_loc):string{
        var base = this.base_url;
        var URL =( base.replace(trailing_slash,"")+  
                "/" +
                options.name 
                    .replace(trailing_slash,"") 
                    .replace(leading_slash,"") + 
                
                ((!!options.version) 
                 ?  "/" +options.version + (this.params.suffix?this.params.suffix:'')
                 :'') 
                );
        return URL;
    }

};




