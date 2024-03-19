import Gun ,{IGunInstance} from 'gun';
import { UnimatrixDB } from '../src/common';
import {exec} from 'child_process';

console.log=()=>{};

export const timeout=1000*15;

export function getRandomInt(min:number, max:number) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}


/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
function execShellCommand(cmd:string) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if(error) 
                console.error(error);
            if(stdout)
                console.info(stdout);
            if(stderr)
                console.warn(stderr);
            resolve(stdout? stdout : stderr);
        });
    });
}


let db:UnimatrixDB;

export const testDb=()=>{

    if(db)
        return db;
    try{
        db = new Gun({
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


