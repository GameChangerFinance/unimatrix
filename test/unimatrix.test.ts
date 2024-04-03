import { JSONStringify, UnimatrixDB } from '../src/common';
import {     
  genDataKey,
  onData,
  getData,
  setData,
  //unimatrix-sync
  cardano,
} from '../src/index'
import { UnimatrixData, UnimatrixDecryptFn, UnimatrixEncryptFn, UnimatrixValidatorMap } from '../src/unimatrix';
import Gun ,{IGunInstance} from 'gun';
import sha512 from 'crypto-js/sha512'; // lib is using native crypto API nowdays
import aes from 'crypto-js/aes'; // lib is using native crypto API nowdays
import Utf8 from 'crypto-js/enc-utf8'; // lib is using native crypto API nowdays
//const crypto = require('crypto');
import {describe, expect, test,beforeAll,afterAll, jest} from '@jest/globals'
import { cleanDb, getRandomInt,testDb, timeout } from './common';


const testEncryptionFn:UnimatrixEncryptFn=(args)=>{
  const json      =JSONStringify(args.store.file);
  const idHash    =sha512(args.id).toString();
  const publicDataHex=Buffer.from(
      JSONStringify({updatedAt:args.store.updatedAt})
  ).toString('hex');
  const password  =`${idHash}:${publicDataHex}:${args.validator}:${args.path.join('/')}`;
  const ciphertext = aes.encrypt(json, password).toString();
  //using native - deprecated
  // const cipher = crypto.createCipher('aes-256-cbc', password);
  // let ciphertext = cipher.update(json, 'utf8', 'hex');
  // ciphertext += cipher.final('hex');
  const file=`${publicDataHex}:${ciphertext}`;
  return file;
}
const testDecryptionFn:UnimatrixDecryptFn=(args)=>{
  const idHash    =sha512(args.id).toString();
  const [publicDataHex,ciphertext]=(args.store||"").split(':');
  const password  =`${idHash}:${publicDataHex}:${args.validator}:${args.path.join('/')}`;
  const bytes  = aes.decrypt(ciphertext, password);
  const file = JSON.parse(bytes.toString(Utf8));
  //using native - deprecated
  // const decipher = crypto.createDecipher('aes-256-cbc', password);
  // let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  // decrypted += decipher.final('utf8');
  // const file=JSON.parse(decrypted);
  const {updatedAt}=JSON.parse(Buffer.from(publicDataHex,"hex").toString())||{};
  return {file,updatedAt};
}

const testValidatorDefinitions:UnimatrixValidatorMap={
  'foo.testValidatorFunc1':(args)=>{
      return "not implemented"
  },
  'foo.bar.baz.testValidatorFunc1':(args)=>{
    const [foo,bar,privateData1,privateData2,baz,privateData3] = args.path||[];
    if(foo!=='foo')
      return "foo error";
    if(bar!=='bar')
      return "bar error";
    if(baz!=='baz')
      return "baz error";
    if(!privateData1.includes('OnlyWeKnowAbout'))
      return "privateData1 error";
    if(!privateData2.includes('OnlyWeKnowAbout'))
      return "privateData2 error";
    if(!privateData3.includes('OnlyWeKnowAbout'))
      return "privateData3 error";
    return true;
  },
  'foo.bar.baz.testValidatorFunc2':(args)=>{
      return "not implemented"
  },
}

const testCase1={
  id:'secretIdOnlyWeKnowAbout1234',
  validator:'foo.bar.baz.testValidatorFunc1',
  path:[
    'foo',
    'bar',      
    'dataOnlyWeKnowAbout',
    'moreDataOnlyWeKnowAbout',
    'baz',
    'evenMoreDataOnlyWeKnowAbout'
  ],
  store:{
    file:{
      data:{
        arbitrary:{data:{here:getRandomInt(0,999999)}},
        msg25:"🚀 One small step for man, one giant leap for mankind.",
      },
      error:undefined,
    },
    updatedAt:Date.now(),
  },  
  dataKey:{
    key: '25c1a1fce7c5c83122bdda4c19d84df9d3834f8237033a45c265c7374f1d7d1e6cddb24b01702704aec35ac68677ad0288bc3812e4d793305ee7a8c3c429e583',
    path: 'secretIdOnlyWeKnowAbout1234:foo.bar.baz.testValidatorFunc1:foo/bar/dataOnlyWeKnowAbout/moreDataOnlyWeKnowAbout/baz/evenMoreDataOnlyWeKnowAbout'
  },
  validation:true,
  encryptedStore:'U2FsdGVkX1/8PZR8MCX5bGp4PGBotq+ZFXpHpmAeEsW+3EVT+eoArN/HFRszcxIq52EiBw0gh8bPrAI8a0F0tNIr9AKn3BI3AdYFck2mLsElNc2HcXKQ+lGETfrXN8jO7vhXMYN6qVhTLYRi3QaQJZmd0wl0z/5lZ//QXr6xVnE=',
}


const testCase2={
  ...testCase1,
  path:[
    'foo',
    'bar',      
    'dataOnlyWeKnowAbout',
    'moreDataOnlyWeKnowAbout',
    'baz',
    'jeezIDontKnowThisData'
  ],
  validation:"privateData3 error",
}

const testCase3={
  ...testCase1,
  id:'iDoNotKnowTheRightSecretId',
}

const testCase4={...testCase1};  
testCase4.store.file.data.arbitrary.data.here=getRandomInt(0,999999);

describe('generate hashes', () => {
  test('upon data', () => {
    const testCase=testCase1;
    const _dataKey=genDataKey({
      id:testCase.id,
      validator:testCase.validator,
      path:testCase.path,
    });
    //console.dir({dataKey});
    expect(_dataKey).toEqual(testCase.dataKey);
    //expect(_dataKey.path).toBe(testCase.dataKey.path);
  });
});


describe('validate', () => {
  test('right data parameters', () => {
    const testCase=testCase1;
    const validatorFn=testValidatorDefinitions[testCase.validator];
    const validation=validatorFn({
      id:testCase.id,
      validator:testCase.validator,
      path:testCase.path,
      store:testCase.store,
      // file:testCase.file,
      // updatedAt:testCase.updatedAt,    
    })
    expect(validation).toBe(testCase.validation)
  })

  test('wrong data parameters', () => {
    const testCase=testCase2;
    const validatorFn=testValidatorDefinitions[testCase.validator];
    const validation=validatorFn({
      id:testCase.id,
      validator:testCase.validator,
      path:testCase.path,
      store:testCase.store,
      // file:testCase.file,
      // updatedAt:testCase.updatedAt,    
    })
    expect(validation).toBe(testCase.validation)
  });
});



describe('encrypt and decrypt data ', () => {
  test('using crypto-js/aes for testing', () => {
    const testCase=testCase1;
    
    const encryptedStore=testEncryptionFn({
      id:testCase.id,
      validator:testCase.validator,
      path:testCase.path,
      store:testCase.store,
      // file:testCase.file,
      // updatedAt:testCase.updatedAt,
    });
    const decryptedStore=testDecryptionFn({
      id:testCase.id,
      validator:testCase.validator,
      path:testCase.path,
      store:encryptedStore,
      //file:encryptedStore,
    });
    expect(decryptedStore).toEqual(testCase.store)
  });
});

// async tests ahead...

jest.setTimeout(timeout);

describe('with connection to Unimatrix', () => {
  beforeAll(async () => {
    await cleanDb();
  });
  describe('set and get data', () => {
    test('using right secrets', async ()=> {
      const testCase=testCase1;
      //lets patch test case for concurrent processes running these tests across the globe 
      testCase.id=`${testCase.id}_${String(getRandomInt(0,999999999))}_${String(Date.now())}`;
      let db=testDb();
      
      const setResponse=await setData({
        db,
        checkByFetching:false,    
        id:testCase.id,
        validator:testCase.validator,
        validators:testValidatorDefinitions,
        path:testCase.path,
        store:testCase.store,
        //file:testCase.file,    
        //updatedAt:testCase.updatedAt,
        encryptData:testEncryptionFn,
        decryptData:testDecryptionFn,
      });
      // console.dir({setResponse})
      
      const getOkResponse=await getData({
        db,
        id:testCase.id,
        validator:testCase.validator,
        validators:testValidatorDefinitions,
        path:testCase.path,
        timeout:1000*3,
        encryptData:testEncryptionFn,
        decryptData:testDecryptionFn,
      });

      // console.dir({getOkResponse})

      expect(getOkResponse).toEqual(testCase.store);
      //(db as any)=undefined;
    })


    test('using wrong secrets', async ()=> {
      const testCase=testCase1;
      //lets patch test case for concurrent processes running these tests across the globe 
      testCase.id=`${testCase.id}_${String(getRandomInt(0,999999999))}_${String(Date.now())}`;
      let db=testDb();
      
      const setResponse=await setData({
        db,
        checkByFetching:false,    
        id:testCase.id,
        validator:testCase.validator,
        validators:testValidatorDefinitions,
        path:testCase.path,
        store:testCase.store,
        //file:testCase.file,    
        //updatedAt:testCase.updatedAt,
        encryptData:testEncryptionFn,
        decryptData:testDecryptionFn,
      });
      // console.dir({setResponse})
      
      const getFailResponse=await getData({
        db,
        id:testCase3.id,
        validator:testCase3.validator,
        validators:testValidatorDefinitions,
        path:testCase3.path,
        timeout:1000*3,
        encryptData:testEncryptionFn,
        decryptData:testDecryptionFn,
      });
      // console.dir({getFailResponse})

      expect(getFailResponse).toBeUndefined();
      //(db as any)=undefined;
    });
  });

  describe('set and listen for data', () => {

    test('using right secrets',(done)=> {
      const testCase=testCase4;  
      //lets patch test case for concurrent processes running these tests across the globe 
      testCase.id=`${testCase.id}_${String(getRandomInt(0,999999999))}_${String(Date.now())}`;
      let db=testDb();
      
      const setResponse=setData({
        db,
        checkByFetching:false,    
        id:testCase.id,
        validator:testCase.validator,
        validators:testValidatorDefinitions,
        path:testCase.path,
        store:testCase.store,
        //file:testCase.file,    
        //updatedAt:testCase.updatedAt,
        encryptData:testEncryptionFn,
        decryptData:testDecryptionFn,
      }).then(()=>{

        onData({
          db,
          id:testCase.id,
          validator:testCase.validator,
          validators:testValidatorDefinitions,
          path:testCase.path,
          timeout:1000*3,
          encryptData:testEncryptionFn,
          decryptData:testDecryptionFn,
          on:({store,validationError,timeoutError,node,stop})=>{
            //These can get triggered, even several times, by other testing instances, so better simplify test:
            // if(validationError){
            //     stop();
            //     return done("ValidationError: "+validationError)
            // }
            // if(store?.file?.error){
            //     stop();
            //     return done("UserDefinedError: "+store?.file?.error);
            // } 
            if(timeoutError){
              stop();
              expect(timeoutError).toBe(true);
              return done("TimeoutError: timeout listening for data");
            }        
            if(store){
              stop();
              expect(store).toEqual(testCase.store);    
              done();
            }       
          }
        });
      });
    });

    test('using wrong secrets',(done)=> {
      const testCase=testCase4; 
      //lets patch test case for concurrent processes running these tests across the globe 
      testCase.id=`${testCase.id}_${String(getRandomInt(0,999999999))}_${String(Date.now())}`;

      let db=testDb();
      
      const setResponse=setData({
        db,
        checkByFetching:false,    
        id:testCase.id,
        validator:testCase.validator,
        validators:testValidatorDefinitions,
        path:testCase.path,
        store:testCase.store,
        // file:testCase.file,    
        // updatedAt:testCase.updatedAt,
        encryptData:testEncryptionFn,
        decryptData:testDecryptionFn,
      }).then(()=>{

          onData({
            db,
            id:testCase3.id,
            validator:testCase.validator,
            validators:testValidatorDefinitions,
            path:testCase.path,
            timeout:1000*3,
            encryptData:testEncryptionFn,
            decryptData:testDecryptionFn,
            on:({store,validationError,timeoutError,node,stop})=>{
              //These can get triggered, even several times, by other testing instances, so better simplify test:
              // if(validationError){
              //     stop();
              //     return done("ValidationError: "+validationError)
              // }
              // if(store?.file?.error){
              //     stop();
              //     return done("UserDefinedError: "+store?.file?.error);
              // } 
              // if(store){
              //   stop();      
              //   expect(store).toBeUndefined();
              // }        
              if(timeoutError){
                stop();
                expect(timeoutError).toBe(true);
                return done(); // we are expecting this error to get triggered after wrongly-listening for the right data
              }               
            }
          });
        });
    });
  });
});

