"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var version_resolution_1 = require("./version_resolution");
var utils_1 = require("./utils");
var dTransform = /** @class */ (function () {
    function dTransform(store, storify, destorify) {
        this.store = store;
        this.storify = storify;
        this.destorify = destorify;
    }
    // ------------------------------
    // CRUD
    // ------------------------------
    dTransform.prototype.create = function (options) {
        var _this = this;
        return Promise.resolve(this.storify(options.value))
            .then(function (y) {
            var obj = {
                name: options.name,
                version: options.version,
                upsert: options.upsert,
                value: y,
            };
            if (options.hasOwnProperty("depends"))
                obj.depends = options.depends;
            return _this.store.create(obj);
        });
    };
    dTransform.prototype.update = function (options) {
        var _this = this;
        return Promise.resolve(this.storify(options.value))
            .then(function (y) {
            var obj = {
                name: options.name,
                version: options.version,
                upsert: options.upsert,
                value: y,
            };
            if (options.hasOwnProperty("depends"))
                obj.depends = options.depends;
            return _this.store.update(obj);
        });
    };
    dTransform.prototype.fetch = function (query, opts) {
        var _this = this;
        if ((!!opts) && !!opts.novalue) {
            var out = Promise.resolve(this.store.fetch(query, opts));
            return out;
        }
        return Promise.resolve(this.store.fetch(query, opts))
            .then(function (x) {
            return Promise.all(x.map(function (r) { return Promise.resolve(_this.destorify(r.value))
                .then(function (z) {
                var out = { name: r.name, version: r.version, value: z };
                if (r.hasOwnProperty("depends"))
                    out.depends = r.depends;
                return out;
            }); }));
        });
    };
    dTransform.prototype.fetchOne = function (query, opts) {
        var _this = this;
        if ((!!opts) && !!!opts.novalue) {
            var out = Promise.resolve(this.store.fetchOne(query, opts));
            return out;
        }
        return Promise.resolve(this.store.fetchOne(query, opts))
            .then(function (x) { return Promise.resolve(_this.destorify(x.value))
            .then(function (val) {
            var out = {
                name: x.name,
                version: x.version,
                value: val,
            };
            if (x.hasOwnProperty("depends"))
                out.depends = x.depends;
            return out;
        }); });
    };
    dTransform.prototype.depends = function (x) {
        return Promise.resolve(this.store.depends(x));
    };
    dTransform.prototype.del = function (request) {
        return Promise.resolve(this.store.del(request));
    };
    // ------------------------------
    // ENUMERATION (defer to the remote)
    // ------------------------------
    dTransform.prototype.latest_version = function (name) {
        return Promise.resolve(this.store.latest_version(name));
    };
    dTransform.prototype.packages = function () {
        return Promise.resolve(this.store.packages());
    };
    dTransform.prototype.versions = function (name) {
        return Promise.resolve(this.store.versions(name));
    };
    return dTransform;
}());
exports.dTransform = dTransform;
var sTransform = /** @class */ (function () {
    function sTransform(store, storify, destorify) {
        this.store = store;
        this.storify = storify;
        this.destorify = destorify;
    }
    // ------------------------------
    // CRUD
    // ------------------------------
    sTransform.prototype.create = function (options) {
        var val = {
            name: options.name,
            version: options.version,
            upsert: options.upsert,
            value: this.storify(options.value),
        };
        if (options.hasOwnProperty("depends"))
            val.depends = options.depends;
        return this.store.create(val);
    };
    sTransform.prototype.update = function (options) {
        var val = {
            name: options.name,
            version: options.version,
            upsert: options.upsert,
            value: this.storify(options.value),
        };
        if (options.hasOwnProperty("depends"))
            val.depends = options.depends;
        return this.store.update(val);
    };
    sTransform.prototype.fetch = function (query, opts) {
        var _this = this;
        return this.store.fetch(query, opts)
            .map(function (x) {
            var out = {
                name: x.name,
                version: x.version,
            };
            if ((!opts) || !opts.novalue)
                out.value = _this.destorify(x.value);
            if (x.hasOwnProperty("depends"))
                out.depends = x.depends;
            return out;
        });
    };
    sTransform.prototype.fetchOne = function (query, opts) {
        var x = this.store.fetchOne(query, opts);
        var out = {
            name: x.name,
            version: x.version,
        };
        if ((!opts) || !opts.novalue)
            out.value = this.destorify(x.value);
        if (x.hasOwnProperty("depends"))
            out.depends = x.depends;
        return out;
    };
    sTransform.prototype.depends = function (x) {
        if (Array.isArray(x)) {
            return version_resolution_1.calculate_dependencies_sync(x, this);
        }
        if (utils_1.isPackageLoc(x)) {
            return version_resolution_1.calculate_dependencies_sync([x], this);
        }
        else {
            var y = Object.keys(x)
                .filter(function (y) { return x.hasOwnProperty(y); })
                .map(function (y) { return { name: y, version: x[y] }; });
            return version_resolution_1.calculate_dependencies_sync(y, this);
        }
    };
    ;
    sTransform.prototype.del = function (request) {
        return this.store.del(request);
    };
    // ------------------------------
    // ENUMERATION (defer to the remote)
    // ------------------------------
    sTransform.prototype.latest_version = function (name) {
        return this.store.latest_version(name);
    };
    sTransform.prototype.packages = function () {
        return this.store.packages();
    };
    sTransform.prototype.versions = function (name) {
        return this.store.versions(name);
    };
    return sTransform;
}());
exports.sTransform = sTransform;
//# sourceMappingURL=transform.js.map