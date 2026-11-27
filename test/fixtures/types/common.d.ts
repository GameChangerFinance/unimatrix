export declare const logger: Console | undefined;
export declare const JSONStringify: {
    (value: any, replacer?: ((this: any, key: string, value: any) => any) | undefined, space?: string | number | undefined): string;
    (value: any, replacer?: (string | number)[] | null | undefined, space?: string | number | undefined): string;
};
export { IGunInstance as UnimatrixDB, IGunChain as UnimatrixDBDataNode } from 'gun';
