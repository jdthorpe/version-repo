import * as Promise from "bluebird"
import {sync_repository,
    resource_data,
    package_loc,
    fetch_opts,
    deferred_readable_repository,
    repository,
    ConfigOptions,
    remote_repo_config,
    readable_repository,
    deferred_repository,
    bare_deferred_readable_repository} from "./src/typings"

declare class SYNC_REPOSITORY<T> implements sync_repository<T>{
    create(options:resource_data<T>):boolean;
    update(options:resource_data<T>):boolean;
    del(options:package_loc):boolean;
    fetch(x:package_loc|package_loc[],fetch_opts?:fetch_opts):resource_data<T>[];
    fetchOne(x:package_loc,opts?:fetch_opts):resource_data<T>;
    depends(x:package_loc|package_loc[]|{[key: string]:string}):package_loc[];
    packages():string[] ;
    versions():{[x:string]:string[]};
    versions(name:string):string[];
    latest_version(name:string):string
}

declare class DEFERRED_READABLE_REPOSITORY<T> implements deferred_readable_repository<T> {
    fetch(x:package_loc|package_loc[],opts?:fetch_opts):Promise<resource_data<T>[]>;
    fetchOne(x:package_loc,opts?:fetch_opts):Promise<resource_data<T>>;
    depends(x:package_loc|package_loc[]|{[key: string]:string}):Promise<package_loc[]>;
    packages():Promise<string[]> ;
    versions():Promise<{ [x:string]:string[] }>;
    versions(name:string):Promise<string[]>;
    latest_version(name:string):Promise<string>
}


declare class DEFERRED_REPOSITORY<T> implements deferred_repository<T> {
    create(x:resource_data<T>):Promise<boolean>;
    update(x:resource_data<T>):Promise<boolean>;
    del(x:package_loc):Promise<boolean>;
    fetch(x:package_loc|package_loc[],fetch_opts?:fetch_opts):Promise<resource_data<T>[]>;
    fetchOne(x:package_loc,opts?:fetch_opts):Promise<resource_data<T>>;
    depends(x:package_loc|package_loc[]|{[key: string]:string}):Promise<package_loc[]>;
    packages():Promise<string[]> ;
    versions():Promise<{ [x:string]:string[] }>;
    versions(name:string):Promise<string[]>;
    latest_version(name:string):Promise<string>
}



// export { MemoryRepo } from "./src/memory_repo";
export declare class MemoryRepo<T> extends SYNC_REPOSITORY<T> implements sync_repository<T> {
    constructor(config:ConfigOptions)
}

// export { ReadonlyBuffer } from "./src/buffer";
export declare class ReadonlyBuffer<T> extends DEFERRED_READABLE_REPOSITORY<T> implements deferred_readable_repository<T> { 
    constructor(remote_store:readable_repository<T>,
                options:ConfigOptions|MemoryRepo<T>)
}

// export class sTransform<S,T>  implements sync_repository<T> {
export declare class sTransform<S,T> extends SYNC_REPOSITORY<T> implements sync_repository<T> {
    constructor(store:sync_repository<S>,
                storify:{(x:T):S},
                destorify:{(x:S):T})
}

// export class dTransform<S,T>  implements deferred_repository<T> {
export declare class dTransform<S,T> extends DEFERRED_READABLE_REPOSITORY<T> implements deferred_readable_repository<T> { 
    constructor(store:repository<S>,
                storify:{(x:T):(S|Promise<S>)},
                destorify:{(x:S):(T|Promise<T>)})
}

// export { ProcessedBuffer } from './src/ProcessedBuffer';
// export class ProcessedBuffer<S,T> implements deferred_readable_repository<T> {
export declare class ProcessedBuffer<S,T> extends DEFERRED_READABLE_REPOSITORY<T> implements deferred_readable_repository<T> {
    constructor(remote_store:deferred_readable_repository<S>,
                process:{(x:S):(T|Promise<T>)},
                options:ConfigOptions|MemoryRepo<T>)
}

// export { RemoteRepo } from "./src/remote_repo";
// export class RemoteRepo<T> implements deferred_repository<T> {
export declare class RemoteRepo<T> extends DEFERRED_REPOSITORY<T> implements deferred_repository<T> {
    constructor(params:remote_repo_config)
}

export * from './src/utils.d';
export * from './src/type-guards.d';


export declare function calculate_dependencies  (
        x: package_loc[],
        repo:bare_deferred_readable_repository,
        ):Promise<package_loc[]>


