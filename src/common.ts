import Gun,{IGunInstance,IGunChain} from 'gun';

export const logger:Console|undefined =undefined;
// <Console>{
//   log:()=>{},
//   info:()=>{},
//   dir:()=>{},
//   warn:console.warn,
//   error:console.error
// };
export const JSONStringify            = JSON.stringify;
export {
  IGunInstance as UnimatrixDB, 
  //GunDataNode  as UnimatrixDBDataNode 
  IGunChain    as UnimatrixDBDataNode 
} from 'gun';

