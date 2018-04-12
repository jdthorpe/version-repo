/// <reference types="bluebird" />
import { MemoryRepo } from './memory_repo';
import * as Promise from 'bluebird';
import { package_loc, resource_data, deferred_readable_repository, fetch_opts, ConfigOptions } from "./typings";
export declare class ProcessedBuffer<S, T> implements deferred_readable_repository<T> {
    remote_store: deferred_readable_repository<S>;
    private process;
    versions_cache: {
        [x: string]: string[];
    };
    lastest_versions_cache: {
        [x: string]: string;
    };
    local_store: MemoryRepo<T>;
    full_versions_cache: boolean;
    constructor(remote_store: deferred_readable_repository<S>, process: {
        (x: S): (T | Promise<T>);
    }, options?: ConfigOptions | MemoryRepo<T>);
    fetch(query: package_loc[] | package_loc, opts?: fetch_opts): Promise<resource_data<T>[]>;
    depends(x: package_loc | package_loc[] | {
        [key: string]: string;
    }, cached?: boolean): Promise<package_loc[]>;
    fetchOne(request: package_loc, opts?: fetch_opts): Promise<resource_data<T>>;
    create(request: package_loc, pkg: T): Promise<never>;
    update(request: package_loc, pkg: T): Promise<never>;
    del(request: package_loc): Promise<never>;
    latest_version(name: string, cached?: boolean): Promise<string>;
    versions_sync(): {
        [x: string]: string[];
    };
    versions_sync(name: string): string[];
    packages(cached?: boolean): Promise<string[]>;
    versions(): Promise<{
        [x: string]: string[];
    }>;
    versions(name: string): Promise<string[]>;
    versions(name: string, cached: boolean): Promise<string[]>;
}
