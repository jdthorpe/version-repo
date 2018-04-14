/// <reference types="bluebird" />
import * as Promise from "bluebird";
import { repository, deferred_readable_repository } from "../src/typings";
export interface backend_test_instance {
    name: string;
    repo: repository<any> | deferred_readable_repository<any>;
    backend?: repository<any>;
    before?: (done?: () => void) => void | Promise<any>;
    after?: (done?: () => void) => void | Promise<any>;
    beforeEach?: (done?: () => void) => void | Promise<any>;
    afterEach?: (done?: () => void) => void | Promise<any>;
}
export declare function generate_version_resolution_tests(test: backend_test_instance): void;
