/// <reference types="bluebird" />
import * as Promise from "bluebird";
import { repository } from "../src/typings";
export interface test_instance {
    name: string;
    repo: repository<any>;
    before?: ((done?: () => void) => void) | (() => Promise<any>);
    after?: ((done?: () => void) => void) | (() => Promise<any>);
    beforeEach?: ((done?: () => void) => void) | (() => Promise<any>);
    afterEach?: ((done?: () => void) => void) | (() => Promise<any>);
}
export declare function generate_tests(inst: test_instance): void;
