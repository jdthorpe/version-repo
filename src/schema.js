"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Ajv = require("ajv");
var ajv = new Ajv();
function is_package_loc(x) {
    return true;
}
exports.is_package_loc = is_package_loc;
function is_package_data(x) {
    return true;
}
exports.is_package_data = is_package_data;
function is_package_loc_array(x) {
    return true;
}
exports.is_package_loc_array = is_package_loc_array;
var semver_type = { "type": "string", "semver": { "valid": true, "loose": true } };
//# sourceMappingURL=schema.js.map