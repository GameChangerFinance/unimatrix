require('dotenv').config();
const { toArray, toBoolean } = require('./common');

const defaultLogLevels="info,error,warn";
const logLevels=toArray(process.env.LOG_LEVELS||defaultLogLevels,',');

const useLogger=()=>{
    const validLoggerLevels=[
        'error',
        'warn',
        'info',
        'log',
        'dir',
    ];
    const blackHole=()=>{};
    // const reset = "\x1b[0m";
    const logger={
        ...console,//GunDb requirement, im sorry.
        // log: (text) => console.log("\x1b[32m" + text + reset),
        // //dir: (text) => console.dir("\x1b[32m" + text + reset),
        // error: (text) => console.error("\x1b[31m" + text + reset),
        // info: (text) => console.info("\x1b[34m" + text + reset),
        // warn: (text) => console.warn("\x1b[33m" + text + reset),
    };

    for(level of validLoggerLevels){
        if(logLevels.includes(level))
            logger[level]=console[level]//console[level];
        else 
            logger[level]=blackHole;
    }
    console={...logger};
    return logger;
};
module.exports={
    logLevels,
    useLogger,
}