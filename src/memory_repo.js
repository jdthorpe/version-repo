"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var semver = require("semver");
var MemoryRepo = /** @class */ (function () {
    function MemoryRepo(options) {
        if (options === void 0) { options = {}; }
        this.options = options;
        this.store = {};
    }
    // connection
    MemoryRepo.prototype.connect = function () {
        return true;
    };
    MemoryRepo.prototype.is_connected = function () {
        return true;
    };
    // ------------------------------
    // CRUD
    // ------------------------------
    MemoryRepo.prototype.create = function (options, pkg) {
        if (this.options.single_version && this.store.hasOwnProperty(options.name)) {
            throw new Error("Duplicate definition of library (" + options.name + ") in single version repository.");
        }
        // validate the options
        options = utils_1.validate_options(options);
        if (!options.version) {
            throw new Error("Version parameter is required to create a package");
        }
        if (this.store.hasOwnProperty(options.name)) {
            // CREATE THE PACKAGE
            //--             if(this.store[options.name][options.version]){
            //--                 throw new Error(`Version ${options.version} of package '${options.name}' already exists`);
            //--             }
            var _latest_version = this.latest_version(options.name);
            if (options.upsert) {
                if (_latest_version && semver.gt(_latest_version, options.version))
                    throw new Error("Version (" + options.version + ") preceeds the latest version (" + _latest_version + ")");
            }
            else {
                if (_latest_version && semver.gte(_latest_version, options.version))
                    throw new Error("Version (" + options.version + ") does not exceed the latest version (" + _latest_version + ")");
            }
        }
        else {
            // CREATE THE PACKAGE
            this.store[options.name] = {};
        }
        // the actual work
        this.store[options.name][options.version] = pkg;
        return true;
    };
    MemoryRepo.prototype.fetch = function (options) {
        // validate the options
        options = utils_1.validate_options_range(options);
        // does the package exist?
        if (!this.store.hasOwnProperty(options.name) || // is there a package container
            !Object.keys(this.store[options.name]).length) {
            throw new Error("No such package: " + options.name);
        }
        // get the version number (key)
        if (options.version) {
            var key = semver.maxSatisfying(Object.keys(this.store[options.name]), options.version);
            if (!key)
                throw new Error("No such version: " + options.version);
        }
        else {
            key = this.latest_version(options.name);
        }
        return {
            name: options.name,
            version: key,
            object: this.store[options.name][key],
        };
    };
    MemoryRepo.prototype.update = function (options, pkg) {
        // validate the options
        options = utils_1.validate_options(options);
        var _latest_version = this.latest_version(options.name);
        if (options.version &&
            !semver.eq(options.version, _latest_version)) {
            throw new Error("Only the most recent version of a package may be updated");
        }
        // the actual work
        this.store[options.name][_latest_version] = pkg;
        return true;
    };
    MemoryRepo.prototype.del = function (options) {
        // validate the options
        options = utils_1.validate_options(options);
        if (!this.store.hasOwnProperty(options.name)) {
            throw new Error("No such package: " + options.name);
        }
        if (!options.version) {
            throw new Error("Version parameter is required when deleting a package");
        }
        if (!(this.store[options.name][options.version])) {
            throw new Error("No such version: " + options.version);
        }
        // the actual work
        delete this.store[options.name][options.version];
        return true;
    };
    MemoryRepo.prototype.exists = function (name) {
        return this.store[name] !== undefined;
    };
    MemoryRepo.prototype.latest_version = function (name) {
        if (this.store[name])
            return (semver.maxSatisfying(Object.keys(this.store[name]), '>=0.0.0'));
        else
            return null;
    };
    // return a list of available packages
    MemoryRepo.prototype.packages = function () {
        var out = Object.keys(this.store);
        for (var i = out.length; i > 0; i--)
            if (!Object.keys(this.store[out[i - 1]]).length)
                out.splice(i - 1, 1);
        return out;
    };
    MemoryRepo.prototype.versions = function (name) {
        if (typeof name === 'undefined') {
            var out = {};
            for (var name in this.store) {
                if (!this.store.hasOwnProperty(name)) {
                    continue;
                }
                out[name] = Object.keys(this.store[name]);
            }
            return out;
        }
        else {
            if (!this.store.hasOwnProperty(name)) {
                throw new Error('No such package: ' + name);
            }
            return Object.keys(this.store[name]);
        }
    };
    return MemoryRepo;
}());
exports.MemoryRepo = MemoryRepo;
//# sourceMappingURL=memory_repo.js.map