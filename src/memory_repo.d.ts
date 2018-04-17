import { package_loc, resource_data, sync_repository, fetch_opts, ConfigOptions } from "./typings";
export declare class MemoryRepo<T> implements sync_repository<T> {
    private config;
    store: {
        [x: string]: {
            [x: string]: T;
        };
    };
    dependencies: {
        [x: string]: {
            [x: string]: {
                [x: string]: string;
            };
        };
    };
    constructor(config?: ConfigOptions);
    connect(): boolean;
    is_connected(): boolean;
    create(options: resource_data<T>): boolean;
    depends(x: package_loc | package_loc[] | {
        [key: string]: string;
    }): package_loc[];
    fetch(query: package_loc | package_loc[], opts?: fetch_opts): resource_data<T>[];
    fetchOne(query: package_loc, opts?: fetch_opts): resource_data<T>;
    update(options: resource_data<T>): boolean;
    del(options: package_loc): boolean;
    exists(name: string): boolean;
    latest_version(name: string): string;
    packages(): string[];
    versions(): {
        [x: string]: string[];
    };
    versions(name: string): string[];
}
