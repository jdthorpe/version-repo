export default function (name: any): C3;
export declare class C3 {
    name: string;
    map: {
        [x: string]: string[];
    };
    constructor(name: string);
    add(name: string, parentName: string): C3;
    run(): string[];
}
