"use strict";
///<path ="./typings.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
//-- import {resource_data,deferred_repository, repository, package_loc} from "./typings"
var Promise = require("bluebird");
var semver = require("semver");
var processed_buffer_1 = require("./processed_buffer");
var ReadonlyBuffer = /** @class */ (function (_super) {
    __extends(ReadonlyBuffer, _super);
    function ReadonlyBuffer(remote_store, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, remote_store, function (x) { return x; }, options) || this;
        _this.options = options;
        return _this;
    }
    ReadonlyBuffer.prototype.fetch = function (request, cached) {
        var _this = this;
        if (cached === void 0) { cached = true; }
        // ------------------------------
        // RESOLVE THE VERSION
        // ------------------------------
        var _version;
        if (semver.valid(request.version)) {
            // NOTHING TO DO 
            _version = Promise.resolve(request.version);
        }
        else if (semver.validRange(request.version)) {
            // RESOLVE THE RANGE TO A SPECIFIC VERSION
            if (cached && this.versions_cache.hasOwnProperty(request.name)) {
                // RESOLVE THE VERSION USING THE CACHED VERSIONS
                var version = semver.maxSatisfying(this.versions_cache[request.name], request.version);
                _version = Promise.resolve(version);
            }
            else {
                // RESOLVE THE VERSION FROM VERSIONS FETCHED FROM THE SERVER
                _version = this.versions(request.name).then(function (versions) {
                    // cache the versions for next time
                    _this.versions_cache[request.name] = versions;
                    return semver.maxSatisfying(versions, request.version);
                });
            }
        }
        else if (!request.version || request.version === 'latest') {
            if (cached && this.lastest_versions_cache.hasOwnProperty(request.name)) {
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
        else {
            // invalid 
            _version = Promise.reject(Error("No such version \"" + request.version + "\" for module \"" + request.version + "\""));
        }
        return _version.then(function (version) {
            var rqst = { name: request.name, version: version };
            try {
                // RETURN THE LOCALLY STORED VERSION, if available
                return Promise.resolve(_this.local_store.fetch(rqst));
            }
            catch (err) {
                return Promise.resolve(_this.remote_store.fetch(rqst))
                    .then(function (x) {
                    _this.local_store.create(rqst, x.object);
                    return x;
                });
            }
        });
    };
    return ReadonlyBuffer;
}(processed_buffer_1.ProcessedBuffer));
exports.ReadonlyBuffer = ReadonlyBuffer;
//# sourceMappingURL=buffer.js.map