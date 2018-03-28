"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var semver = require("semver");
var version_resolution_1 = require("./version_resolution");
var MemoryRepo = /** @class */ (function () {
    function MemoryRepo(options) {
        if (options === void 0) { options = {}; }
        this.options = options;
        this.store = {};
        this.dependencies = {};
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
    MemoryRepo.prototype.create = function (options) {
        if (this.options.single_version && this.store.hasOwnProperty(options.name)) {
            throw new Error("Duplicate definition of library (" + options.name + ") in single version repository.");
        }
        // validate the options
        var loc = utils_1.validate_options(options);
        if (!loc.version) {
            throw new Error("Version parameter is required to create a package");
        }
        if (this.store.hasOwnProperty(loc.name)) {
            // CREATE THE PACKAGE
            //--             if(this.store[loc.name][loc.version]){
            //--                 throw new Error(`Version ${loc.version} of package '${loc.name}' already exists`);
            //--             }
            var _latest_version = this.latest_version(loc.name);
            if (!options.force) {
                if (options.upsert) {
                    if (_latest_version && semver.gt(_latest_version, loc.version))
                        throw new Error("Version (" + loc.version + ") preceeds the latest version (" + _latest_version + ")");
                }
                else {
                    if (_latest_version && semver.gte(_latest_version, loc.version))
                        throw new Error("Version (" + loc.version + ") does not exceed the latest version (" + _latest_version + ")");
                }
            }
        }
        else {
            // CREATE THE PACKAGE
            this.store[loc.name] = {};
            this.dependencies[loc.name] = {};
        }
        // the actual work
        this.store[loc.name][loc.version] = options.value;
        if (options.hasOwnProperty("depends"))
            this.dependencies[loc.name][loc.version] = options.depends;
        return true;
    };
    MemoryRepo.prototype.depends = function (x) {
        if (Array.isArray(x)) {
            var out = version_resolution_1.calculate_dependencies_sync(x, this);
            return out;
        }
        if (utils_1.isPackageLoc(x)) {
            var out = version_resolution_1.calculate_dependencies_sync([x], this);
            return out;
        }
        else {
            var y = Object.keys(x)
                .filter(function (y) { return x.hasOwnProperty(y); })
                .map(function (y) { return { name: y, version: x[y] }; });
            var out = version_resolution_1.calculate_dependencies_sync(y, this);
            return out;
        }
    };
    ;
    MemoryRepo.prototype.fetch = function (query, opts) {
        var _this = this;
        if (Array.isArray(query)) {
            var names_1 = query.map(function (x) { return x.name; });
            return this.depends(query)
                .filter(function (x) { return (opts && opts.dependencies) || names_1.indexOf(x.name) != -1; })
                .map(function (x) { return _this.fetchOne(x); });
        }
        else if ((opts && opts.dependencies)) {
            return this.depends([query]).map(function (x) { return _this.fetchOne(x); });
        }
        else {
            return [this.fetchOne(query)];
        }
    };
    MemoryRepo.prototype.fetchOne = function (query, opts) {
        // validate the query
        query = utils_1.validate_options_range(query);
        // does the package exist?
        if (!this.store.hasOwnProperty(query.name) || // is there a package container
            !Object.keys(this.store[query.name]).length) {
            throw new Error("No such package: " + query.name + "versions include: " + JSON.stringify(Object.keys(this.store)));
        }
        // get the version number (key)
        if (query.version) {
            var key = semver.maxSatisfying(Object.keys(this.store[query.name]), query.version);
            if (!key)
                throw new Error("No such version: " + query.version);
        }
        else {
            key = this.latest_version(query.name);
        }
        var out = {
            name: query.name,
            version: key
        };
        if (!(opts && opts.novalue))
            out.value = this.store[query.name][key];
        if (this.dependencies.hasOwnProperty(query.name) &&
            this.dependencies[query.name].hasOwnProperty(key)) {
            out.depends = {};
            var deps = this.dependencies[query.name][key];
            for (var _i = 0, _a = Object.keys(deps); _i < _a.length; _i++) {
                var key_1 = _a[_i];
                if (deps.hasOwnProperty(key_1))
                    out.depends[key_1] = deps[key_1];
            }
        }
        return out;
    };
    MemoryRepo.prototype.update = function (options) {
        // validate the options
        var loc = utils_1.validate_options(options);
        var _latest_version = this.latest_version(loc.name);
        if (loc.version &&
            !semver.eq(loc.version, _latest_version)) {
            throw new Error("Only the most recent version of a package may be updated");
        }
        // the actual work
        this.store[loc.name][_latest_version] = options.value;
        if (options.hasOwnProperty("depends"))
            this.dependencies[loc.name][_latest_version] = options.depends;
        return true;
    };
    MemoryRepo.prototype.del = function (options) {
        // validate the options
        var loc = utils_1.validate_options(options);
        if (!this.store.hasOwnProperty(loc.name)) {
            throw new Error("No such package: " + loc.name);
        }
        if (!loc.version) {
            throw new Error("Version parameter is required when deleting a package");
        }
        if (!(this.store[loc.name][loc.version])) {
            throw new Error("No such version: " + loc.version);
        }
        // the actual work
        delete this.store[loc.name][loc.version];
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