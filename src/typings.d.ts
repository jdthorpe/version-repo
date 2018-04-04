
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
}

// FUNCTION PARAMETERS INTERFACE
export interface resource_data<T> {
    name:string;
    version:string;
    value?:T; // yes it's optional. (i.e. when `fetch_opts.novalue = true`)
    depends?:{[key:string]:string};
    upsert?:boolean
    force?:boolean
}

// --------------------------------------------------
// dependency repo
// --------------------------------------------------

export interface ReadonlyBuffer<T> extends deferred_repository<T>{
    //------------------------------
    // CRUD
    //------------------------------
    fetch_sync(options:package_loc):resource_data<T>;

}

export interface bare_deferred_readable_repository {
    fetchOne(x:package_loc,opts?:fetch_opts):Promise<resource_data<any>>;
    versions(name:string):Promise<string[]>;
}


export interface deferred_readable_repository<T> {

    fetch(x:package_loc|package_loc[],opts?:fetch_opts):Promise<resource_data<T>[]>;

    fetchOne(x:package_loc,opts?:fetch_opts):Promise<resource_data<T>>;

    depends(x:package_loc[],...args):Promise<package_loc[]>;
    depends(x:package_loc,...args):Promise<package_loc[]>;
    depends(x:{[key: string]:string},...args):Promise<package_loc[]>;

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

interface fetch_opts {
    dependencies?:boolean; // fetch the dependencies in addition to the packages explicitly being querried (think bower)
    novalue?:boolean; // don't include the value (i.e. just return the name, version, and list of package dependencies
    cached?:boolean; // don't include the value (i.e. just return the name, version, and list of package dependencies
}

export interface deferred_repository<T> {

    //------------------------------
    // CRUD
    //------------------------------

    create(x:resource_data<T>):Promise<boolean>;

    update(x:resource_data<T>):Promise<boolean>;

    del(x:package_loc):Promise<boolean>;

    fetch(x:package_loc|package_loc[],fetch_opts?:fetch_opts):Promise<resource_data<T>[]>;

    fetchOne(x:package_loc,opts?:fetch_opts):Promise<resource_data<T>>;

    depends(x:package_loc[]):Promise<package_loc[]>;
    depends(x:package_loc):Promise<package_loc[]>;
    depends(x:{[key: string]:string}):Promise<package_loc[]>;

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

    fetch(x:package_loc|package_loc[],fetch_opts?:fetch_opts):resource_data<T>[];

    fetchOne(x:package_loc,opts?:fetch_opts):resource_data<T>;

    depends(x:package_loc[]):package_loc[];
    depends(x:package_loc):package_loc[];
    depends(x:{[key: string]:string}):package_loc[];

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

    create(options:resource_data<T>):boolean;
    update(options:resource_data<T>):boolean;
    del(options:package_loc):boolean;

    fetch(x:package_loc|package_loc[],fetch_opts?:fetch_opts):resource_data<T>[];

    fetchOne(x:package_loc,opts?:fetch_opts):resource_data<T>;

    depends(x:package_loc[]):package_loc[];
    depends(x:package_loc):package_loc[];
    depends(x:{[key: string]:string}):package_loc[];

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

