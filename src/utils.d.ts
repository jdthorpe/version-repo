import { package_loc } from "./typings";
export declare function is_package_loc(x: any): x is package_loc;
export declare var name_regex: RegExp;
export declare function validate_options(options: package_loc): package_loc;
export declare function validate_options_range(options: package_loc): package_loc;
export declare function isPackageLoc(x: {
    [k: string]: string;
} | package_loc): x is package_loc;
