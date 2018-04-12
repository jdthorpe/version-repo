/// <reference types="bluebird" />
import { package_loc, bare_deferred_readable_repository, sync_readable_repository } from "./typings";
import * as Promise from 'bluebird';
export declare function calculate_dependencies(x: package_loc[], repo: bare_deferred_readable_repository): Promise<package_loc[]>;
export declare function calculate_dependencies_sync(x: package_loc[], repo: sync_readable_repository<any>): package_loc[];
