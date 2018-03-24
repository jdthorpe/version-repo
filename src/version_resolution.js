"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var semver_1 = require("semver");
var utils_1 = require("./utils");
//-- import * as Q from 'q';
var Promise = require("bluebird");
var c3_1 = require("./c3");
function calculate_dependencies(
// versions is a dictionary with the where each key correspondes to a
// dependency name, and each value is a string or vector of strings with 
// the available versions for that key
x, repo) {
    if (!x.every(utils_1.is_package_loc))
        throw new Error("x is not an array of package locations");
    if (repo === undefined)
        throw new Error("missing repo");
    var VERSIONS = {};
    var MRO = c3_1.default("main");
    // a graph of require statements for determinig sources of conflict
    var STACKS = {};
    var stack = [];
    var dependencies = x.map(function (y) {
        return { name: y.name,
            version: y.version,
            depth: 0,
        };
    });
    return __resolve__();
    function __resolve__() {
        if (dependencies.length === 0) {
            // We're done! (whew, that was easy).
            return Promise.resolve(
            //formerly: MRO.run().slice(1).map( (name: string) => {
            MRO.run().map(function (name) {
                console.log(JSON.stringify({ name: name, version: VERSIONS[name] }, null, 4));
                return {
                    name: name,
                    version: VERSIONS[name]
                };
            }));
        }
        else {
            // acuquire the next dependenciy
            var d = dependencies.shift();
            MRO.add((d.depth > 0) ? stack[d.depth - 1].name : "main", d.name);
            if (VERSIONS.hasOwnProperty(d.name)) {
                // THE VERSION OF THIS PACKAGE HAS ALREADY BEEN DETERMINED
                if (!semver_1.satisfies(VERSIONS[d.name], d.version)) {
                    // THE NEW DEPENDENCY CONFLICTS WITH A PRIOR ONE...
                    var m = STACKS[d.name]
                        .map(function (y) {
                        return y.map(function (x) { return JSON.stringify(x); }).join(" > ");
                    }).join("\n  + ");
                    throw new Error("Version Conflict:\n  + " + m);
                }
                return __resolve__();
            }
            // manage the stack
            stack.splice(d.depth);
            stack.push(d);
            // get the list of available versions
            return Promise.resolve(repo.versions(d.name))
                .then(function (versions) {
                // get the maximum version satisfying the current requirement 
                var v = semver_1.maxSatisfying(versions, d.version);
                if (!v)
                    throw new Error(noSuchVersionMessage(d, versions));
                // RECORD THE VERSION
                VERSIONS[d.name] = v;
                // GATHER ANY DEPENDENCIES OF THIS VERSION
                return Promise.resolve(repo.fetchOne({ name: d.name, version: v }, { novalue: true }))
                    .then(function (x) {
                    if (!x.hasOwnProperty("depends"))
                        // nothing to do.
                        return __resolve__();
                    var depends = x.depends;
                    var new_dependencies = Object.keys(depends)
                        .filter(function (k) { return depends.hasOwnProperty(k); })
                        .map(function (k) {
                        return {
                            name: k,
                            version: depends[k]
                        };
                    });
                    new_dependencies.map(function (nd) {
                        if (!utils_1.is_package_loc(nd))
                            throw new Error("internal error; got an invalid package descriptor");
                        // append the depth to each new dependency
                        nd.depth = d.depth + 1;
                        // KEEP TRACK OF THE PATH TO EACH PACKAGE IMPORT
                        if (!STACKS.hasOwnProperty(nd.name))
                            STACKS[nd.name] = [];
                        STACKS[nd.name].push(stack.slice().concat(nd));
                    });
                    // append add the new dependencies to the dependencies to be determined
                    Array.prototype.unshift.apply(dependencies, new_dependencies);
                    return __resolve__();
                });
            });
        }
    }
    // this needs to live where `stack` is in scope...
    function noSuchVersionMessage(d, versions) {
        return "No such version \"" + d.version + "\" of package \"" + d.name + "\". Possible versions include:\n       - \"" + versions.join('"\n        - "') + "\"\n    (" + stack.map(function (x) { return JSON.stringify(x); }).join(" > ") + ")";
    }
}
exports.calculate_dependencies = calculate_dependencies;
function calculate_dependencies_sync(
// versions is a dictionary with the where each key correspondes to a
// dependency name, and each value is a string or vector of strings with 
// the available versions for that key
x, repo) {
    if (!x.every(utils_1.is_package_loc))
        throw new Error("x is not an array of package locations");
    if (repo === undefined)
        throw new Error("missing repo");
    var VERSIONS = {};
    var MRO = c3_1.default("main");
    // a graph of require statements for determinig sources of conflict
    var STACKS = {};
    var stack = [];
    var dependencies = x.map(function (y) {
        return { name: y.name,
            version: y.version,
            depth: 0,
        };
    });
    // synchronous implementation
    while (dependencies.length) {
        // acuquire the next dependenciy
        var d = dependencies.shift();
        MRO.add((d.depth > 0) ? stack[d.depth - 1].name : "main", d.name);
        if (VERSIONS.hasOwnProperty(d.name)) {
            // THE VERSION OF THIS PACKAGE HAS ALREADY BEEN DETERMINED
            if (!semver_1.satisfies(VERSIONS[d.name], d.version)) {
                // THE NEW DEPENDENCY CONFLICTS WITH A PRIOR ONE...
                var m = STACKS[d.name]
                    .map(function (y) {
                    return y.map(function (x) { return JSON.stringify(x); }).join(" > ");
                }).join("\n  + ");
                throw new Error("Version Conflict:\n  + " + m);
            }
            continue;
        }
        // manage the stack
        stack.splice(d.depth);
        stack.push(d);
        // get the list of available versions
        var versions = repo.versions(d.name);
        // get the maximum version satisfying the current requirement 
        var v = semver_1.maxSatisfying(versions, d.version);
        if (!v)
            throw new Error(noSuchVersionMessage(d, versions));
        // RECORD THE VERSION
        VERSIONS[d.name] = v;
        var obj = repo.fetchOne({ name: d.name, version: v }, { novalue: true });
        if (!obj.hasOwnProperty("depends"))
            continue;
        var depends = obj.depends;
        // GATHER ANY DEPENDENCIES OF THIS VERSION
        var new_dependencies = Object.keys(depends)
            .filter(function (k) { return depends.hasOwnProperty(k); })
            .map(function (k) {
            return {
                name: k,
                version: depends[k]
            };
        });
        new_dependencies.map(function (nd) {
            if (!utils_1.is_package_loc(nd))
                throw new Error("internal error; got an invalid package descriptor");
            // append the depth to each new dependency
            nd.depth = d.depth + 1;
            // KEEP TRACK OF THE PATH TO EACH PACKAGE IMPORT
            if (!STACKS.hasOwnProperty(nd.name))
                STACKS[nd.name] = [];
            STACKS[nd.name].push(stack.slice().concat(nd));
        });
        // append add the new dependencies to the dependencies to be determined
        Array.prototype.unshift.apply(dependencies, new_dependencies);
    }
    return MRO.run().slice(1).map(function (name) {
        return {
            name: name,
            version: VERSIONS[name]
        };
    });
    // this needs to live where `stack` is in scope...
    function noSuchVersionMessage(d, versions) {
        return "No such version \"" + d.version + "\" of package \"" + d.name + "\". Possible versions include:\n       - \"" + versions.join('"\n        - "') + "\"\n    (" + stack.map(function (x) { return JSON.stringify(x); }).join(" > ") + ")";
    }
}
exports.calculate_dependencies_sync = calculate_dependencies_sync;
//# sourceMappingURL=version_resolution.js.map