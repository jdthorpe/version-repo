import { package_loc } from "./typings";
export declare const name_regex_pattern = "^([a-zA-Z](?:(-(?=[A-Za-z]))|[a-zA-Z])*)$";
export declare const name_regex: RegExp;
export declare function validate_options(options: package_loc): package_loc;
export declare function validate_options_range(options: package_loc): package_loc;
