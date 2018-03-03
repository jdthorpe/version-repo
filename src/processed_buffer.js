"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var memory_repo_1 = require("./memory_repo");
var Promise = require("bluebird");
var semver = require("semver");
var ProcessedBuffer = /** @class */ (function () {
    function ProcessedBuffer(remote_store, processor, options) {
        if (options === void 0) { options = {}; }
        this.remote_store = remote_store;
        this.processor = processor;
        // the local store stores promises for the resourse data
        this.local_store = new memory_repo_1.MemoryRepo(options);
        this.fetch_queue = [];
        this.versions_cache = {};
        this.full_versions_cache = false;
        this.lastest_versions_cache = {};
    }
    // ------------------------------
    // a buffer only method
    // ------------------------------
    // THE ONLY REAL METHOD FOR THIS CLASS
    ProcessedBuffer.prototype.fetch_sync = function (request) {
        if (semver.validRange(request.version) && !semver.valid(request.version)) {
            // RANGE BASED REQUEST 
            if (!(request.name in this.versions_cache)) {
                throw new Error("Range based Fetch_Sync of package with un-cached version: " + JSON.stringify(request));
            }
            var version = semver.maxSatisfying(this.versions_cache[request.name], request.version);
            if (!version) {
                throw new Error("No version satisfying \"" + request.version + "\" for module \"" + request.version + "\"");
            }
            request.version = request.version;
        }
        return this.local_store.fetch(request);
    };
    // ------------------------------
    // CRUD
    // ------------------------------
    // THE ONLY REAL METHOD FOR THIS CLASS
    ProcessedBuffer.prototype.fetch = function (request, cached_range) {
        var _this = this;
        if (cached_range === void 0) { cached_range = true; }
        try {
            // RETURN THE LOCALLY STORED VERSION, if available
            return Promise.resolve(this.local_store.fetch(request));
        }
        catch (err) {
            var raw_data;
            var out;
            // FETCH THE ITEM
            return Promise.resolve(this.remote_store.fetch(request))
                .then(function (x) {
                raw_data = x;
                return Promise.resolve(_this.processor(x.object));
            })
                .then(function (x) {
                _this.local_store.create({
                    name: raw_data.name,
                    version: raw_data.version,
                }, x);
                return {
                    name: raw_data.name,
                    version: raw_data.version,
                    object: x,
                };
            });
        }
    };
    ProcessedBuffer.prototype.create = function (request, pkg) {
        return Promise.reject(Error('Cannot create a record in a read-only buffer'));
    };
    ProcessedBuffer.prototype.update = function (request, pkg) {
        return Promise.reject(Error('Cannot update a record in a read-only buffer'));
    };
    ProcessedBuffer.prototype.del = function (request) {
        return Promise.reject(Error('Cannot delete a record in a read-only buffer'));
    };
    // ------------------------------
    // SUGAR / CRUFT
    // ------------------------------
    // defer to the remote
    //--     resolve_versions(request){ return this.remote_store.resolve_versions(request); }
    // ------------------------------
    // ENUMERATION (defer to the remote)
    // ------------------------------
    ProcessedBuffer.prototype.latest_version = function (name, cached) {
        if (cached === void 0) { cached = true; }
        if (cached && name in this.lastest_versions_cache) {
            return Promise.resolve(this.lastest_versions_cache[name]);
        }
        else {
            return Promise.resolve(this.remote_store.latest_version(name));
        }
    };
    ProcessedBuffer.prototype.versions_sync = function (name) {
        return Promise.resolve(this.local_store.versions());
    };
    ProcessedBuffer.prototype.packages = function () {
        return Promise.resolve(this.remote_store.packages());
    };
    ProcessedBuffer.prototype.versions = function (name, cached) {
        var _this = this;
        if (cached === void 0) { cached = true; }
        if (cached && name && name in this.versions_cache) {
            return Promise.resolve(this.versions_cache[name]);
        }
        else if (cached && !name && this.full_versions_cache) {
            return Promise.resolve(this.versions_cache);
        }
        else if (name) {
            return Promise.resolve(this.remote_store.versions(name))
                .then(function (x) {
                _this.versions_cache[name] = x;
                return x;
            });
        }
        else {
            return Promise.resolve(this.remote_store.versions())
                .then(function (x) {
                _this.versions_cache = x;
                _this.full_versions_cache = true;
                return x;
            });
        }
    };
    return ProcessedBuffer;
}());
exports.ProcessedBuffer = ProcessedBuffer;
//# sourceMappingURL=processed_buffer.js.map