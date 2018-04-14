"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("superagent-bluebird-promise");
var Promise = require("bluebird");
var semver = require("semver");
var utils_1 = require("./utils");
var trailing_slash = /\/$/;
var leading_slash = /^\//;
var RemoteRepo = /** @class */ (function () {
    function RemoteRepo(params) {
        this.params = params;
        this.base_url = !!params.base_url ? params.base_url : "";
    }
    // ------------------------------
    // CRUD
    // ------------------------------
    RemoteRepo.prototype.create = function (options) {
        var _this = this;
        // validate the options
        return new Promise(function (resolve) {
            resolve(utils_1.validate_options(options));
        })
            .then(function (loc) {
            return request.post(_this._build_url(loc))
                .send({
                value: options.value,
                depends: options.depends
            })
                .then(function (response) {
                return true;
            })
                .catch(function (err) {
                if (err.body && err.body.error && err.body.error !== undefined)
                    throw new Error(err.body.error); // the full response object
                throw new Error(err); // the full response object
            });
        });
    };
    RemoteRepo.prototype.update = function (options) {
        var _this = this;
        return new Promise(function (resolve) {
            resolve(utils_1.validate_options(options));
        })
            .then(function (loc) {
            return request.put(_this._build_url(loc))
                .send({ value: options.value, depends: options.depends })
                .then(function (response) {
                return true;
            })
                .catch(function (err) {
                if (err.body && err.body.error && err.body.error !== undefined)
                    throw new Error(err.body.error); // the full response object
                throw new Error(err); // the full response object
            });
        });
    };
    RemoteRepo.prototype.del = function (options) {
        var _this = this;
        return new Promise(function (resolve) {
            resolve(utils_1.validate_options(options));
        })
            .then(function (loc) {
            return request.del(_this._build_url(loc))
                .then(function (response) {
                return true;
            })
                .catch(function (err) {
                if (err.body && err.body.error && err.body.error !== undefined)
                    throw new Error(err.body.error); // the full response object
                throw new Error(err); // the full response object
            });
        });
    };
    RemoteRepo.prototype.depends = function (x) {
        return request.get(this.base_url.replace(trailing_slash, "") + "/")
            .send({ method: "depends", args: [x] })
            .then(function (response) {
            if (!response.body) {
                throw new Error("No response body.");
            }
            return response.body;
        })
            .catch(function (err) {
            if (err.body && err.body.error && err.body.error !== undefined)
                throw new Error(err.body.error); // the full response object
            throw new Error(err); // the full response object
        });
    };
    RemoteRepo.prototype.fetch = function (query, opts) {
        return request.get(this.base_url.replace(trailing_slash, "") + "/")
            .send({ method: "fetch", args: [query, opts] })
            .then(function (response) {
            if (!response.body) {
                throw new Error("No response body.");
            }
            //if(! response.body.value) throw new Error("Request failed to return the `value` attribute.")
            return response.body;
        })
            .catch(function (err) {
            if (err.body && err.body.error)
                throw new Error(err.body.error); // the full response object
            throw err;
        });
    };
    RemoteRepo.prototype.fetchOne = function (query, opts) {
        var _this = this;
        return Promise.resolve(utils_1.validate_options_range(query))
            .then(function (options) {
            return request.get(_this._build_url(options))
                .send({ method: "fetchOne", args: [options, opts] })
                .then(function (response) {
                if (!response.body.contents) {
                    throw new Error("Request failed to return the `contents` attribute.");
                }
                var contents = response.body.contents;
                if (options.name !== contents.name) {
                    throw new Error("'response.contents.name' (" + contents.name + ") differes from the requested resource name (" + options.name + ").");
                }
                if (typeof options.version === 'string' &&
                    !semver.satisfies(contents.version, options.version)) {
                    throw new Error("'response.contents.version' (" + contents.version + ") does not match the requested version (" + options.version + ").");
                }
                return contents;
            })
                .catch(function (err) {
                if (err.body && err.body.error)
                    throw new Error(err.body.error); // the full response object
                throw err;
            });
        });
    };
    RemoteRepo.prototype.resolve_versions = function (versions) {
        return request.get(this._build_url({ name: 'resolve' }))
            .query(versions)
            .then(function (response) {
            return response.body;
        })
            .catch(function (err) {
            if (err.body && err.body.error)
                throw new Error(err.body.error); // the full response object
            throw err;
        });
    };
    // ------------------------------
    // ENUMERATION
    // ------------------------------
    RemoteRepo.prototype.latest_version = function (name) {
        return request.get(this._build_url({ name: name, version: 'latest_version' }))
            .then(function (response) {
            return response.body;
        })
            .catch(function (err) {
            throw new Error("Failed to fetch latest version for packages:  " + name + " with message " + err.text); // the full response object
        });
    };
    // return a list of available packages
    RemoteRepo.prototype.packages = function () {
        return request.get(this._build_url({ name: "/" }))
            .set('Accept', 'application/json')
            .then(function (res) {
            return res.body;
        })
            .catch(function (err) {
            throw new Error("Failed to acquire package"); // the full response object
        });
    };
    RemoteRepo.prototype.versions = function (name) {
        // TODO: I'm just not sure how well this plan was thought through.
        var url_object = (typeof name === 'undefined') ?
            { name: "versions" } :
            { name: name, version: "versions" };
        return request
            .get(this._build_url(url_object))
            .then(function (response) { return response.body; })
            .catch(function (err) {
            throw new Error("Failed to acquire versions for package " + name + " with message " + err.text);
        });
    };
    // ------------------------------
    // UTILITIES
    // ------------------------------
    RemoteRepo.prototype._build_url = function (options) {
        var base = this.base_url;
        var URL = (base.replace(trailing_slash, "") +
            "/" +
            options.name
                .replace(trailing_slash, "")
                .replace(leading_slash, "") +
            ((!!options.version)
                ? "/" + options.version + (this.params.suffix ? this.params.suffix : '')
                : ''));
        return URL;
    };
    return RemoteRepo;
}());
exports.RemoteRepo = RemoteRepo;
;
//# sourceMappingURL=remote_repo.js.map