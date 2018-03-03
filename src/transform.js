"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var dTransform = /** @class */ (function () {
    function dTransform(store, storify, destorify) {
        this.store = store;
        this.storify = storify;
        this.destorify = destorify;
    }
    // ------------------------------
    // CRUD
    // ------------------------------
    dTransform.prototype.fetch = function (request, cached_range) {
        var _this = this;
        if (cached_range === void 0) { cached_range = true; }
        var out;
        return (Promise.resolve(this.store.fetch(request))
            .then(function (x) {
            out = x;
            return Promise.resolve(_this.destorify(x.object))
                .then(function (y) {
                out.object = y;
                return out;
            });
        }));
    };
    dTransform.prototype.create = function (request, x) {
        var _this = this;
        return Promise.resolve(this.storify(x)).then(function (y) { return _this.store.create(request, y); });
    };
    dTransform.prototype.update = function (request, x) {
        var _this = this;
        return Promise.resolve(this.storify(x)).then(function (y) { return _this.store.update(request, y); });
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
    sTransform.prototype.fetch = function (request, cached_range) {
        if (cached_range === void 0) { cached_range = true; }
        var x = this.store.fetch(request);
        x.object = this.destorify(x.object);
        return x;
    };
    sTransform.prototype.create = function (request, x) {
        return this.store.create(request, this.storify(x));
    };
    sTransform.prototype.update = function (request, x) {
        return this.store.update(request, this.storify(x));
    };
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