
import { clean, validRange } from 'semver';
import { package_loc } from   "./typings";

export const name_regex_pattern = "^([a-zA-Z](?:(-(?=[A-Za-z]))|[a-zA-Z])*)$";
export const name_regex = new RegExp(name_regex_pattern);

export function validate_options(options:package_loc):package_loc{

    if( !options.name){
        throw new Error('missing required value options.name');
    }

    if( typeof options.name !== 'string'){
        throw new Error('options.name must be a string.');
    }
    if(! name_regex.test(options.name)){
        throw new Error('value of options.name is invalid: '+options.name);
    }

    if( !options.version){
        throw new Error('missing required value options.version');
    }

    if( options.version && typeof options.version !== 'string'){
        throw new Error('options.name must be a string.');
    }

    var version:string = clean(options.version);
    if(!version)
        throw new Error('Invalid version string: ' + options.version);

    return {name:options.name,version:version};
    
}


// Identical to validate_options except for the call to validRange
export function validate_options_range(options:package_loc):package_loc{

    if( !options.name){
        throw new Error('missing required value options.name');
    }

    if( typeof options.name !== 'string'){
        throw new Error('options.name must be a string.');
    }

    if( options.version && typeof options.version !== 'string'){
        throw new Error('options.name must be a string.');
    }

    if(options.version){
        var version:string = validRange(options.version);
        if(!version)
            throw new Error('Invalid version string: ' + options.version);
        return {name:options.name,version:version};
    }else{
        return {name:options.name};
    }
}


