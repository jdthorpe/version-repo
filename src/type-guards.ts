
import { package_loc, resource_data } from "./typings"
import { name_regex_pattern } from "./utils"

import * as Ajv from 'ajv'
import  ajvSemver = require('ajv-semver');

const schema = {
  "definitions": {
    "resource-data": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "pattern": name_regex_pattern        
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
          "pattern": name_regex_pattern        
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
          "pattern": name_regex_pattern
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
}


// create the ajv instance
const ajv = new Ajv();
ajvSemver(ajv)
ajv.addSchema(schema,"version-repo-types");

// compile the validators
const ajv_is_strict_resource_loc = ajv.compile({"$ref":"version-repo-types#/definitions/resource-loc"})
const ajv_is_strict_resource_loc_array = ajv.compile({"$ref":"version-repo-types#/definitions/resource-loc-array"})
const ajv_is_resource_loc = ajv.compile({"$ref":"version-repo-types#/definitions/resource-loc"})
const ajv_is_resource_loc_array = ajv.compile({"$ref":"version-repo-types#/definitions/resource-loc-array"})
const ajv_is_resource_data = ajv.compile({"$ref":"version-repo-types#/definitions/resource-data"})
export const ajv_is_depends_object = ajv.compile({"$ref":"version-repo-types#/definitions/depends-object"})


// export the type-guards
export function is_strict_package_loc(x): x is package_loc {
    return (<boolean>ajv_is_strict_resource_loc(x));
}
export function is_strict_package_loc_array(x:package_loc[]): x is package_loc[] {
    return (<boolean>ajv_is_strict_resource_loc_array(x));
}
export function is_package_loc(x): x is package_loc {
    return (<boolean>ajv_is_resource_loc(x));
}
export function is_package_loc_array(x:package_loc[]): x is package_loc[] {
    return (<boolean>ajv_is_resource_loc_array(x));
}
export function is_package_data<T>(x:resource_data<T>): x is resource_data<T> {
    return (<boolean>ajv_is_resource_data(x));
}
export function is_depends_object(x): boolean {
    return (<boolean>ajv_is_depends_object(x));
}


