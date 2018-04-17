"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var Ajv = require("ajv");
var ajvSemver = require("ajv-semver");
var schema = {
    "definitions": {
        "resource-data": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "pattern": utils_1.name_regex_pattern
                },
                "version": {
                    "oneOf": [
                        {
                            "type": "string",
                            "semver": {
                                "valid": true,
                                "loose": true
                            }
                        },
                        {
                            "enum": [
                                "latest"
                            ]
                        }
                    ]
                },
                "depends": {
                    "$ref": "#/definitions/depends-object"
                },
                "upsert": {
                    "type": "boolean"
                },
                "force": {
                    "type": "boolean"
                }
            },
            "required": [
                "name",
                "version",
                "value"
            ],
            "additionalProperties": false
        },
        "strict-resource-loc": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "pattern": utils_1.name_regex_pattern
                },
                "version": {
                    "type": "string",
                    "semver": {
                        "validRange": true,
                        "loose": true
                    }
                }
            },
            "required": [
                "name",
                "version"
            ],
            "additionalProperties": false
        },
        "resource-loc": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "pattern": utils_1.name_regex_pattern
                },
                "version": {
                    "type": "string",
                    "semver": {
                        "validRange": true,
                        "loose": true
                    }
                }
            },
            "required": [
                "name"
            ],
            "additionalProperties": false
        },
        "strict-resource-loc-array": {
            "type": "array",
            "items": {
                "$ref": "#/definitions/strict-resource-loc"
            }
        },
        "resource-loc-array": {
            "type": "array",
            "items": {
                "$ref": "#/definitions/resource-loc"
            }
        },
        "depends-object": {
            "type": "object",
            "patternProperties": {
                "^([a-zA-Z](?:(-(?=[A-Za-z]))|[a-zA-Z])*)$": {
                    "type": "string",
                    "validRange": {
                        "valid": true,
                        "loose": true
                    }
                }
            },
            "additionalProperties": false
        }
    }
};
// create the ajv instance
var ajv = new Ajv();
ajvSemver(ajv);
ajv.addSchema(schema, "version-repo-types");
// compile the validators
var ajv_is_strict_resource_loc = ajv.compile({ "$ref": "version-repo-types#/definitions/resource-loc" });
var ajv_is_strict_resource_loc_array = ajv.compile({ "$ref": "version-repo-types#/definitions/resource-loc-array" });
var ajv_is_resource_loc = ajv.compile({ "$ref": "version-repo-types#/definitions/resource-loc" });
var ajv_is_resource_loc_array = ajv.compile({ "$ref": "version-repo-types#/definitions/resource-loc-array" });
var ajv_is_resource_data = ajv.compile({ "$ref": "version-repo-types#/definitions/resource-data" });
exports.ajv_is_depends_object = ajv.compile({ "$ref": "version-repo-types#/definitions/depends-object" });
// export the type-guards
function is_strict_package_loc(x) {
    return ajv_is_strict_resource_loc(x);
}
exports.is_strict_package_loc = is_strict_package_loc;
function is_strict_package_loc_array(x) {
    return ajv_is_strict_resource_loc_array(x);
}
exports.is_strict_package_loc_array = is_strict_package_loc_array;
function is_package_loc(x) {
    return ajv_is_resource_loc(x);
}
exports.is_package_loc = is_package_loc;
function is_package_loc_array(x) {
    return ajv_is_resource_loc_array(x);
}
exports.is_package_loc_array = is_package_loc_array;
function is_package_data(x) {
    return ajv_is_resource_data(x);
}
exports.is_package_data = is_package_data;
function is_depends_object(x) {
    return exports.ajv_is_depends_object(x);
}
exports.is_depends_object = is_depends_object;
//# sourceMappingURL=type-guards.js.map