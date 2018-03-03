"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var semver_1 = require("semver");
function is_package_loc(x) {
    if (x === undefined)
        return false;
    if (typeof x.name !== "string" || !exports.name_regex.test(x.name))
        return false;
    if (!x.version || x.version === 'latest') {
        x.version = ">=0.0.1";
        return true;
    }
    if (typeof x.version !== "string" || !(semver_1.validRange(x.version) || x.version === "latest"))
        return false;
    return true;
}
exports.is_package_loc = is_package_loc;
exports.name_regex = /^([a-zA-Z](?:(-(?=[A-Za-z]))|[a-zA-Z])*)$/;
function validate_options(options) {
    if (!options.name) {
        throw new Error('missing required value options.name');
    }
    if (typeof options.name !== 'string') {
        throw new Error('options.name must be a string.');
    }
    if (!exports.name_regex.test(options.name)) {
        throw new Error('value of options.name is invalid: ' + options.name);
    }
    if (!options.version) {
        throw new Error('missing required value options.version');
    }
    if (options.version && typeof options.version !== 'string') {
        throw new Error('options.name must be a string.');
    }
    var version = semver_1.clean(options.version);
    if (!version)
        throw new Error('Invalid version string: ' + options.version);
    return { name: options.name, version: version };
}
exports.validate_options = validate_options;
// Identical to validate_options except for the call to validRange
function validate_options_range(options) {
    if (!options.name) {
        throw new Error('missing required value options.name');
    }
    if (typeof options.name !== 'string') {
        throw new Error('options.name must be a string.');
    }
    if (options.version && typeof options.version !== 'string') {
        throw new Error('options.name must be a string.');
    }
    if (options.version) {
        var version = semver_1.validRange(options.version);
        if (!version)
            throw new Error('Invalid version string: ' + options.version);
        return { name: options.name, version: version };
    }
    else {
        return { name: options.name };
    }
}
exports.validate_options_range = validate_options_range;
//# sourceMappingURL=utils.js.map