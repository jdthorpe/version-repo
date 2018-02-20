
import * as Promise from "bluebird"

// borrowed from node.d.ts "url" module
export interface Url {
    href?: string;
    protocol?: string;
    auth?: string;
    hostname?: string;
    port?: string;
    host?: string;
    pathname?: string;
    search?: string;
    query?: string | any;
    slashes?: boolean;
    hash?: string;
    path?: string;
}

export interface file_repo_config { 
    directory:string;
    ext?:string;  
}

export interface remote_repo_config { 
    app?:any,
    server_config?:Url,
    base_url?:string; 
    suffix?:string;
}

export interface repo_router_config { 
    repository:repository<any>;
    router?:any;  // TODO : give this the Express app type
    query_credentials?:() => void;
    modify_credentials?:() => void;
    dependency_repo?:repository<{[x:string]:string}>
}

// FUNCTION PARAMETERS INTERFACE
export interface package_loc {
    name:string;
    version?:string;
    upsert?:boolean
}

// FUNCTION PARAMETERS INTERFACE
export interface resource_data<T> {
    name:string;
    version?:string;
    object:T;
}

export interface ReadonlyBuffer<T> extends deferred_repository<T>{
    //------------------------------
    // CRUD
    //------------------------------
    fetch_sync(options:package_loc):resource_data<T>;

}

export interface deferred_readable_repository<T> {

    fetch(options:package_loc):Promise<resource_data<T>>;

    //------------------------------
    // ENUMERATION 
    //------------------------------

    // RETURN A LIST OF AVAILABLE NAMED RESOURCES OR A PROMISE FOR SAID LIST
    packages():Promise<string[]> ;

    // RETURN A LIST OF AVAILABLE VERSIONS OF A NAMED RESOURCE OR A PROMISE FOR SAID LIST
    versions():Promise<{ [x:string]:string[] }>;

    versions(name:string):Promise<string[]>;

    // RETURNS THE LASTEST VERSION OF A NAMED RESOURCE  OR A PROMISE FOR SAID STRING
    latest_version(name:string):Promise<string>

}

export interface deferred_repository<T> {

    //------------------------------
    // CRUD
    //------------------------------

    create(options:package_loc,pkg:T):Promise<boolean>;

    update(options:package_loc,pkg:T):Promise<boolean>;

    del(options:package_loc):Promise<boolean>;

    fetch(options:package_loc):Promise<resource_data<T>>;

    //------------------------------
    // ENUMERATION 
    //------------------------------

    // RETURN A LIST OF AVAILABLE NAMED RESOURCES OR A PROMISE FOR SAID LIST
    packages():Promise<string[]> ;

    // RETURN A LIST OF AVAILABLE VERSIONS OF A NAMED RESOURCE OR A PROMISE FOR SAID LIST
    versions():Promise<{ [x:string]:string[] }>;
    versions(name:string):Promise<string[]>;

    // RETURNS THE LASTEST VERSION OF A NAMED RESOURCE  OR A PROMISE FOR SAID STRING
    latest_version(name:string):Promise<string>

}

export interface sync_readable_repository<T> {

    fetch(options:package_loc):resource_data<T>;

    //------------------------------
    // ENUMERATION 
    //------------------------------

    // RETURN A LIST OF AVAILABLE NAMED RESOURCES OR A PROMISE FOR SAID LIST
    packages():string[] ;

    // RETURN A LIST OF AVAILABLE VERSIONS OF A NAMED RESOURCE OR A PROMISE FOR SAID LIST
    versions():{[x:string]:string[]};

    versions(name:string):string[];

    // RETURNS THE LASTEST VERSION OF A NAMED RESOURCE  OR A PROMISE FOR SAID STRING
    latest_version(name:string):string

}

export interface sync_repository<T> {

    //------------------------------
    // CRUD
    //------------------------------

    create(options:package_loc,pkg:T):boolean;
    update(options:package_loc,pkg:T):boolean;
    del(options:package_loc):boolean;

    fetch(options:package_loc):resource_data<T>;

    //------------------------------
    // ENUMERATION 
    //------------------------------

    // RETURN A LIST OF AVAILABLE NAMED RESOURCES OR A PROMISE FOR SAID LIST
    packages():string[] ;

    // RETURN A LIST OF AVAILABLE VERSIONS OF A NAMED RESOURCE OR A PROMISE FOR SAID LIST
    versions():{[x:string]:string[]};
    versions(name:string):string[];


    // RETURNS THE LASTEST VERSION OF A NAMED RESOURCE  OR A PROMISE FOR SAID STRING
    latest_version(name:string):string

}

export type readable_repository<T> = sync_readable_repository<T> | deferred_readable_repository<T> ;
export type repository<T> = sync_repository<T> | deferred_repository<T> ;


