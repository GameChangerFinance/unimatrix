import Gun ,{IGunInstance} from 'gun';
import { UnimatrixDB } from '../src/common';
import { mkdtempSync, lstatSync, readdirSync, rmSync, existsSync, realpathSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname, basename } from 'path';

const testDirectory = mkdtempSync(join(realpathSync(tmpdir()), 'unimatrix-test-'));
const testData = join(testDirectory, 'data');

console.log=()=>{};

export const timeout=1000*15;

export function getRandomInt(min:number, max:number) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}


let db:UnimatrixDB;

export const testDb=()=>{

    if(db)
        return db;
    try{
        db = new Gun({
            file: testData,
            peers:[
                //"http://localhost:8765/gun",
                "https://unimatrix01.gamechanger.finance/gun"
            ],
            // Do not use these values as will affect proper fetching, and access to retrieved data from local cache 
            // radisk: false,
            // localStorage: false,
            // axe: false,
            // multicast: false,
        });

        
    }catch(err){
        throw new Error (`Failed to join Unimatrix. ${err||""}`);
    }
    return db;
}

export const cleanDb=async () => {
    if (dirname(testDirectory) !== realpathSync(tmpdir()) || !basename(testDirectory).startsWith('unimatrix-test-') || realpathSync(testDirectory) !== testDirectory) {
        throw new Error('Refusing cleanup outside disposable Unimatrix test data');
    }
    const check = (target:string):void => {
        if (lstatSync(target).isSymbolicLink()) throw new Error('Refusing symlinked test data');
        if (lstatSync(target).isDirectory()) readdirSync(target).forEach(name => check(join(target, name)));
    };
    if (existsSync(testData)) {
        check(testData);
        rmSync(testData, { recursive:true });
    }
};

