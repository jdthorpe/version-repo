
import * as Ajv from 'ajv'
import  ajvSemver = require('ajv-semver');
const ajv = new Ajv();



//const  validate = ajv.compile(schema);
//if (!valid) console.log(validate.errors);

import { package_loc, resource_data } from "./typings"

export function is_package_loc(x): x is package_loc {
    return true
}


export function is_package_data<T>(x:resource_data<T>): x is resource_data<T> {
    return true
}

export function is_package_loc_array(x:package_loc[]): x is package_loc[] {
    return true
}

 
const semver_type = {"type":"string","semver":{"valid":true,"loose":true}};





