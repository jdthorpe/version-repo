import { package_loc, resource_data } from "./typings";
export declare function is_package_loc(x: any): x is package_loc;
export declare function is_package_data<T>(x: resource_data<T>): x is resource_data<T>;
export declare function is_package_loc_array(x: package_loc[]): x is package_loc[];
