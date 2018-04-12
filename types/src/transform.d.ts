/// <reference types="bluebird" />
import { package_loc, resource_data, repository, deferred_repository, sync_repository, fetch_opts } from "./typings";
import * as Promise from "bluebird";
export declare class dTransform<S, T> implements deferred_repository<T> {
    private store;
    private storify;
    private destorify;
    constructor(store: repository<S>, storify: {
        (x: T): (S | Promise<S>);
    }, destorify: {
        (x: S): (T | Promise<T>);
    });
    create(options: resource_data<T>): Promise<boolean>;
    update(options: resource_data<T>): Promise<boolean>;
    fetch(query: package_loc | package_loc[], opts?: fetch_opts): Promise<resource_data<T>[]>;
    fetchOne(query: any, opts?: fetch_opts): Promise<resource_data<T>>;
    depends(x: package_loc): Promise<package_loc[]>;
    depends(x: package_loc[]): Promise<package_loc[]>;
    depends(x: {
        [key: string]: string;
    }): Promise<package_loc[]>;
    del(request: package_loc): Promise<boolean>;
    latest_version(name: string): Promise<string>;
    packages(): Promise<string[]>;
    versions(): Promise<{
        [x: string]: string[];
    }>;
    versions(name: string): Promise<string[]>;
}
export declare class sTransform<S, T> implements sync_repository<T> {
    private store;
    private storify;
    private destorify;
    constructor(store: sync_repository<S>, storify: {
        (x: T): S;
    }, destorify: {
        (x: S): T;
    });
    create(options: resource_data<T>): boolean;
    update(options: resource_data<T>): boolean;
    fetch(query: package_loc | package_loc[], opts?: fetch_opts): resource_data<T>[];
    fetchOne(query: package_loc, opts?: fetch_opts): resource_data<T>;
    depends(x: package_loc): package_loc[];
    depends(x: package_loc[]): package_loc[];
    depends(x: {
        [key: string]: string;
    }): package_loc[];
    del(request: package_loc): boolean;
    latest_version(name: string): string;
    packages(): string[];
    versions(): {
        [x: string]: string[];
    };
    versions(name: string): string[];
}
