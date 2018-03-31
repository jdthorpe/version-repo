"use strict";
///<path ="./typings.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
//-- import {resource_data,deferred_repository, repository, package_loc} from "./typings"
var memory_repo_1 = require("./memory_repo");
var Promise = require("bluebird");
var semver = require("semver");
var utils_1 = require("./utils");
var version_resolution_1 = require("./version_resolution");
//--     fetch(x:package_loc|package_loc[],fetch_opts?:fetch_opts):resource_data<T>[];
//--     fetchOne(x:package_loc,opts?:fetch_opts):resource_data<T>;
var ReadonlyBuffer = /** @class */ (function () {
    function ReadonlyBuffer(remote_store, options) {
        if (options === void 0) { options = {}; }
        this.remote_store = remote_store;
        // the local store stores promises for the resourse data
        this.local_store = new memory_repo_1.MemoryRepo(options);
        this.versions_cache = {};
        this.full_versions_cache = false;
        this.lastest_versions_cache = {};
    }
    ReadonlyBuffer.prototype.fetch = function (query, opts) {
        var _this = this;
        if (Array.isArray(query)) {
            var names_1 = query.map(function (x) { return x.name; });
            return this.depends(query, opts.cached)
                .then(function (pkgs) {
                return Promise.all(pkgs
                    .filter(function (x) { return (opts && opts.dependencies) || names_1.indexOf(x.name) != -1; })
                    .map(function (pkg) { return _this.fetchOne(pkg, opts); }));
            });
        }
        else if (opts && opts.dependencies) {
            return this.depends([query], opts.cached)
                .then(function (pkgs) {
                return Promise.all(pkgs
                    .map(function (x) { return _this.fetchOne(x, opts); }));
            });
        }
        else {
            return this.fetchOne(query, opts).then(function (x) { return [x]; });
        }
    };
    ReadonlyBuffer.prototype.depends = function (x, cached) {
        var _this = this;
        if (!cached)
            return this.remote_store.depends(x); // then(x =>  { it would be possible to verify the depends is consistent witht the stored value...})
        var bare_repo = {
            fetchOne: function (request, opts) { return _this.fetchOne(request, { novalue: true, cached: true }); },
            versions: function (name) { return _this.versions(name, true); }
        };
        if (Array.isArray(x)) {
            return version_resolution_1.calculate_dependencies(x, bare_repo);
        }
        if (utils_1.isPackageLoc(x)) {
            return version_resolution_1.calculate_dependencies([x], bare_repo);
        }
        else {
            var y = Object.keys(x)
                .filter(function (y) { return x.hasOwnProperty(y); })
                .map(function (y) { return { name: y, version: x[y] }; });
            return version_resolution_1.calculate_dependencies(y, bare_repo);
        }
    };
    ;
    // TODO: opts:fetch_opts could have it's type narrowed to just {cached:boolean}, I think
    ReadonlyBuffer.prototype.fetchOne = function (request, opts) {
        var _this = this;
        // ------------------------------
        // RESOLVE THE VERSION
        // ------------------------------
        var _version;
        if (!request.version || request.version === 'latest') {
            // THE 'LATEST' VERSION HAS BEEN REQUESTED
            if (opts.cached && this.lastest_versions_cache.hasOwnProperty(request.name)) {
                _version = Promise.resolve(this.lastest_versions_cache[request.name]);
            }
            else {
                _version = this.latest_version(request.name).then(function (version) {
                    // cache the versions for next time
                    _this.lastest_versions_cache[request.name] = version;
                    return version;
                });
            }
        }
        else if (semver.valid(request.version)) {
            // NOTHING TO DO 
            _version = Promise.resolve(request.version);
        }
        else if (semver.validRange(request.version)) {
            // RESOLVE THE RANGE TO A SPECIFIC VERSION
            if (opts.cached && this.versions_cache.hasOwnProperty(request.name)) {
                // RESOLVE THE VERSION USING THE CACHED VERSIONS
                var version = semver.maxSatisfying(this.versions_cache[request.name], request.version);
                _version = Promise.resolve(version);
            }
            else {
                // RESOLVE THE VERSION FROM VERSIONS FETCHED FROM THE SERVER
                _version = this.versions(request.name, opts.cached).then(function (versions) {
                    // cache the versions for next time
                    _this.versions_cache[request.name] = versions;
                    return semver.maxSatisfying(versions, request.version);
                });
            }
        }
        else {
            // invalid 
            _version = Promise.reject(Error("No such version \"" + request.version + "\" for module \"" + request.version + "\""));
        }
        return _version.then(function (version) {
            var rqst = { name: request.name, version: version };
            try {
                // RETURN THE LOCALLY STORED VERSION, if available
                return Promise.resolve(_this.local_store.fetchOne(rqst))
                    .tapCatch(function (x) { return console.log("error thtown by local store"); });
            }
            catch (err) {
                return Promise.resolve(_this.remote_store.fetchOne(rqst))
                    .then(function (x) {
                    if (!opts.novalue) {
                        // only store the object if the value was also included in the returned value...
                        _this.local_store.create({
                            name: x.name,
                            version: x.version,
                            value: x.value,
                            depends: x.depends,
                            force: true,
                        });
                    }
                    return x;
                });
            }
        });
    };
    ReadonlyBuffer.prototype.create = function (request, pkg) {
        return Promise.reject(Error('Cannot create a record in a read-only buffer'));
    };
    ReadonlyBuffer.prototype.update = function (request, pkg) {
        return Promise.reject(Error('Cannot update a record in a read-only buffer'));
    };
    ReadonlyBuffer.prototype.del = function (request) {
        return Promise.reject(Error('Cannot delete a record in a read-only buffer'));
    };
    // ------------------------------
    // ENUMERATION (defer to the remote)
    // ------------------------------
    ReadonlyBuffer.prototype.latest_version = function (name, cached) {
        if (cached === void 0) { cached = true; }
        if (cached && name in this.lastest_versions_cache) {
            return Promise.resolve(this.lastest_versions_cache[name]);
        }
        else {
            return Promise.resolve(this.remote_store.latest_version(name));
        }
    };
    ReadonlyBuffer.prototype.versions_sync = function (name) {
        return this.local_store.versions(name);
    };
    ReadonlyBuffer.prototype.packages = function (cached) {
        var _this = this;
        if (cached === void 0) { cached = true; }
        if (cached && !name && this.full_versions_cache) {
            return Promise.resolve(Object.keys(this.versions_cache)
                .filter(function (x) { return _this.versions_cache.hasOwnProperty(x); }));
        }
        else {
            return Promise.resolve(this.remote_store.packages()
                .then(function (x) {
                _this.full_versions_cache = x.every(function (name) { return _this.versions_cache.hasOwnProperty(name); });
                return x;
            }));
        }
    };
    ReadonlyBuffer.prototype.versions = function (name, cached) {
        // param: Cached If true, return the cached set of versions if a local
        //        set of versoins were stored, else fetch them from the remote
        //        and store the returned value.  In short cached will be a bit faster but could be out of date
        var _this = this;
        if (cached === void 0) { cached = true; }
        if (cached && name && this.versions_cache.hasOwnProperty(name)) {
            return Promise.resolve(this.versions_cache[name].slice());
        }
        else if (cached && !name && this.full_versions_cache) {
            var out = {};
            for (var key in Object.keys(this.versions_cache)) {
                if (this.versions_cache.hasOwnProperty(key))
                    out[key] = this.versions_cache[key].slice();
            }
            return Promise.resolve(out);
        }
        else if (name) {
            return Promise.resolve(this.remote_store.versions(name))
                .then(function (x) {
                _this.versions_cache[name] = x.slice();
                return x;
            });
        }
        else {
            return Promise.resolve(this.remote_store.versions())
                .then(function (x) {
                _this.versions_cache = {};
                for (var key in Object.keys(x)) {
                    if (x.hasOwnProperty(key))
                        _this.versions_cache[key] = x[key].slice();
                }
                _this.full_versions_cache = true;
                return x;
            });
        }
    };
    return ReadonlyBuffer;
}());
exports.ReadonlyBuffer = ReadonlyBuffer;
/*
import { package_loc, resource_data, deferred_readable_repository } from   "./typings";

import {MemoryRepo} from './memory_repo';
import * as Promise from 'bluebird';
import * as semver from 'semver';


export class ProcessedBuffer<S,T>  implements deferred_readable_repository<T> {

    // insance attributes
    local_store:MemoryRepo<T>;

    versions_cache: {[x:string]: string[]};
    full_versions_cache:boolean;
    lastest_versions_cache: {[x:string]: string};
    fetch_queue:Promise<resource_data<T>>[];

    constructor(public remote_store:deferred_readable_repository<S>,
                public processor:{(x:S):(T|Promise<T>)},
                options = {}){
        // the local store stores promises for the resourse data
        this.local_store = new MemoryRepo<T>(options);
        this.fetch_queue = [];

        this.versions_cache = {};
        this.full_versions_cache = false;
        this.lastest_versions_cache = {};
    }

    // ------------------------------
    // a buffer only method
    // ------------------------------
    // THE ONLY REAL METHOD FOR THIS CLASS
    fetch_sync(request:package_loc):resource_data<T>{

        if(semver.validRange(request.version) && ! semver.valid(request.version)){
            // RANGE BASED REQUEST
            if( ! (request.name in  this.versions_cache)){
                throw new Error(`Range based Fetch_Sync of package with un-cached version: ${JSON.stringify(request)}`)
            }
            var version:string =
                semver.maxSatisfying(
                        this.versions_cache[request.name],
                        request.version);
            if(!version){
                throw new Error(`No version satisfying "${request.version}" for module "${request.version}"`);
            }
            request.version = request.version;
        }
        return this.local_store.fetch(request);
    }

    // ------------------------------
    // CRUD
    // ------------------------------
    // THE ONLY REAL METHOD FOR THIS CLASS
    fetch(request:package_loc):Promise<resource_data<T>>{

        try{

            // RETURN THE LOCALLY STORED VERSION, if available
            return Promise.resolve(this.local_store.fetch(request));

        } catch (err) {

            var raw_data:resource_data<S> ;
            var out:resource_data<T> ;
            // FETCH THE ITEM
            return  Promise.resolve(this.remote_store.fetch(request))
                .then( (x:resource_data<S>) => {
                    raw_data = x;
                    return Promise.resolve<T>(this.processor(x.value))
                })
                .then( (x:T) => {
                    this.local_store.create({
                            name:raw_data.name,
                            version:raw_data.version,
                            value:x,
                        });
                    return {
                            name:raw_data.name,
                            version:raw_data.version,
                            value:x,
                        };
                })
        }

    }

    create(request:package_loc,pkg:T){
        return Promise.reject(Error('Cannot create a record in a read-only buffer'));
    }

    update(request:package_loc,pkg:T){
        return Promise.reject(Error('Cannot update a record in a read-only buffer'));
    }

    del(request:package_loc){
        return Promise.reject(Error('Cannot delete a record in a read-only buffer'));
    }

    // ------------------------------
    // SUGAR / CRUFT
    // ------------------------------
    // defer to the remote
//--     resolve_versions(request){ return this.remote_store.resolve_versions(request); }

    // ------------------------------
    // ENUMERATION (defer to the remote)
    // ------------------------------
    latest_version(name:string,cached=true){
        if(cached && name in this.lastest_versions_cache ){
            return Promise.resolve(this.lastest_versions_cache[name]);
        }else{
            
            return Promise.resolve(this.remote_store.latest_version(name));
        }
    }

    versions_sync():{[x:string]:string[]};
    versions_sync(name:string):string[];
    versions_sync(name?:string):any{
        return Promise.resolve(this.local_store.versions());
    }

    packages (){
        return Promise.resolve(this.remote_store.packages());
    }

    versions():Promise<{[x:string]:string[]}>;
    versions(name:string):Promise<string[]>;
    versions(name?:string,cached=true):Promise<{[x:string]:string[]}> | Promise<string[]>{
        if(cached && name && name in this.versions_cache ){
            return Promise.resolve(this.versions_cache[name]);
        }else if(cached && !name && this.full_versions_cache){
            return Promise.resolve(this.versions_cache);
        }else if(name){
            return Promise.resolve(this.remote_store.versions(name))
                .then( x => {
                        this.versions_cache[name] = x;
                        return x;
                });
        }else{
            return Promise.resolve(this.remote_store.versions())
                .then( x => {
                        this.versions_cache = x;
                        this.full_versions_cache = true;
                        return x;
                });
        }
    }

}


*/
//# sourceMappingURL=buffer.js.map