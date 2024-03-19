import {     
    genDataKey,
  } from '../../src/index'

import {describe, expect, test,beforeAll,afterAll, jest} from '@jest/globals'
import {  DLTTag, NetworkTag, genVkWitnessHexKey, genTxHexKey, genTxHashesKey, cardanoValidatorsFactory } from '../../src/sync';
// import * as CardanoLib from '@emurgo/cardano-serialization-lib-asmjs';
import * as CardanoLib from '@emurgo/cardano-serialization-lib-nodejs';
//import CardanoLib from '../../node_modules/@emurgo/cardano-serialization-lib-asmjs';

// const testCase1={
//     id:'signTxs',
//     dltTag:<cardano.DLTTag>'cardano',
//     networkTag:<cardano.NetworkTag>'preprod',
//     txHash:'71cd8d027eb1794afd08000d3ff4fd9eee38c73f54b6f82159b3147949628e92',
//     vkHash:'d8ad931196680f24c99f65244aa099277684ea1c09f9c95fd9c9d72e',
//     path:[],
//     dataKey:{
//         key: '1cf044d5bb33077c08c06ff074cc80ecb34c6db7df8dd5d4cc68315945e1ba0760b1359dbaf47a93c99142813105ab6f4106f36d7ebed2a1279527541629bf56',
//         path: 'signTxs:cardano.vkWitnessHex:cardano/preprod/71cd8d027eb1794afd08000d3ff4fd9eee38c73f54b6f82159b3147949628e92/d8ad931196680f24c99f65244aa099277684ea1c09f9c95fd9c9d72e'
//     },
// }
// testCase1.path=[
//     testCase1.dltTag,
//     testCase1.networkTag,
//     testCase1.txHash,
//     testCase1.vkHash
// ]
const multisig1={
    "dltTag":"cardano",
    "networkTag": "preprod",
    "dappConnection":"https://beta-preprod-wallet.gamechanger.finance/api/2/run/1-H4sIAAAAAAAAA7VWbW_bNhD-K4K-pAU8VyIp0iowFN2KocPWolhS7ENRFLR4ipnIkkNSjp0g_713lOzKxTqs6CLAFnkvD--eO5G8T8N-A-nz1FfObkI6S4MNDQl-6fdJnrzVrQ3wAuUGBhPbtah9BRW0wenG3oFJLrpraJNz3cA8mfoldecSlsUnabotNLoCP08unG69rggrubVNkywhcbC1cItgy31iTtDft3atg7O7ZIsSowOCth3GM8ewYLfpXHjpMaYYBQWBYgehdxjofbpGS1Q22of0ARV9lBrYQGugrSx4mn_Nwmi2tm2w7eW7rrHVfmLX6mC3cH6wHt1Qr5uGXtb7HhyNNv3yD9i_1n71GnboacCUC66kqM2SqbouS15BxgoFUgDLqqVGiVhowxXLdVHCopJskZfpQ3xm6bK3jZmEEucXu0nlvlWbIy3v__rznQ4BiKB0FcLGP3_2rD-w_JOBdTdvITS23s_1ZvPsRdhRAj_fD-8HWmt3oAfp-4BpRoZ-x8DS-0sIT84qXa1gPqV5fkLmfOBsJObsKYFq72HEi8O3ej2QTb2E-pteI0LAQqR5-vDx4eMs7fqw6UMsoQe3tRX8BhALYYwDT21Bo08BfMhvXJOpvvTeBHMb7lYuZHfOOVXu4Wq3qrdrv74K5dXuZq_vsuuwkXvTNzerIF15JxqTXa0917xSl7ei6DnbripWB7NhtXQ327uMXd2eJjEhRRt90I1ZDZJJSuN3QolRn8JNbx2Yc3vZghsSJC5_qIVm6a0NLdIyNP20i_2k3ce-_t5SDmWk4HW_s43Vbv9KB03AUomI7y8J1Qd30b2BgBQEfR7ckxXsLjoanGU604LLWoLispRCFoqxTElZK4FzkIplQqoCR4LnPGcZajKJc7RCP4X2kssCZxmOaqlRx5VQnGvCZgb9lcylkQWus8ARYtIqXE-wzARrXBX_a4VvjKPG2QLtKpUhGhdlkXHOM4og-nMcFThCc8THHDItFxiDwJgwDlZjx3CZo1bE9WsGQ64o46SRFWYAkngwZIu_Uc9qypozjsHzxY9lVBCLJfrlGBmTpVocs6O1DK7OKQNiXmniVBpFWdOcUNSj5KWQyfqYGeGImF1JkU2zlSfZojzWhOwUpxxEXmQFViXaCHpjnFm04ENW1GcopypxuZTFaDcyhTE_RuUY_hfH_E7RskLETkf2cYzuVEOBUUrq5cFyrB5aLWKfK_RguK54hFgzrEZ-jHXAEQeWibuCOgy_L_wkmSgKXgiqT1GIEnmkr5YN3YRfMHnFbiRmv1SFvLGrCBXoO32knuJxZ1kMPaDK2C11zANxFfYzi3mePY1bGG1iHnfe6dUApxc7H29CQdsGzDtwazzo8RKDm2etGw-zdN03waJp3P-vbdyv32jbvhyPo4fZUfxr7xye03937tpv8F4UdZY0B5BPOcaOC44Ox3sQ3ThW2mFUwfUwTii2ca7btuvbCkV0vMI35ef9Eu8Bq0lydKQGAvpwsvfHO8YcT_9hi_9I7PTLtQ1TfqJgYChCnCDQAvF0mKW1bfGWtP-XW9dwzZgYrHXluoP-nyNDhxH_y6n7H_y_54KC2F8dkP_LAodjE5_Pkn70Ao4LAAA",
    "signer":{
        "mnemonic":"lucky wild glass legal twenty hurry october mountain spatial rain uncle abandon width lady pink",
        "address": "addr_test1qr0dnqmkfldj0lue8nsz2lnyugxt4xf53tfhyxjearrzsx25c6g5as4xzurme5dp49v2d5xle0j57qfezhztk9qjhepqlt9tna",
        "privSpendKey": "10441250b0f0b5c6ce8f9bb2ac711d0587bd3d48c1e3af96a0976b684718085530cf3138858cab670278929d01888f2cdf9c8c11d9061666c6424e32a2c20804",
        "privStakeKey": "38ee59f91c79b4a4c8af4d31d6c55383b421293362a68358cc9737e0441808555d24154ae338e47eedb87a72217d6a21c24669312c948fc451642b7da4341efe",
        "pubSpendKey": "60d0f59f4d016b13260397822157334c0b591b8787018e837e6393985ee894a7",
        "pubStakeKey": "58808596d82738aa09b3bd7c61321f9e63eb91a63e2d7f0637060627508c4e3c",
        "pubSpendKeyHash": "ded983764fdb27ff993ce0257e64e20cba99348ad3721a59e8c62819",
        "pubStakeKeyHash": "54c6914ec2a61707bcd1a1a958a6d0dfcbe54f013915c4bb1412be42",
    },
    "foreignSigner":{
        "pubSpendKeyHash":"d8ad931196680f24c99f65244aa099277684ea1c09f9c95fd9c9d72e"
    },
    "signerVkWitnessHex":"82582060d0f59f4d016b13260397822157334c0b591b8787018e837e6393985ee894a758400755217aacc0eeb65d7510c3e7d79f9d83c824f684ee539ef1fb4aae09c849aad7c12d060668b768d2f980da30ddab5a269d30e9d958f2176a958f664ff4090e",
    "foreignVkWitnessHex":"825820b495c77a7e6695ee6ad44c330f590ca20e9d740a185a93f1128c4e578a582705584007dd3bf439b1faae7bab74a225336458a200cbaaf4ee067729d01c21e405aefe233ac3d1ad6d6d41327cd66de697c0a69ca631071ec00606c84a41401a59d505",
    "transaction":{
        "txHash":"0018040840f15041a65a63a8d95c658897cc99ba571f53b19ac060c13aa29c46",
        "txHex":      "84a70081825820dfc1cb1e7aeb35b5632e4a7b383ecd8d3426da5ba100f767fb1eeca2addb950d02018382583900feff70b08356d72c571ade218c7e2933235d2cdc37259646013a27d961d11bcf82ebd0ca2afdaf96e11ec71e43ab4e454cbe1495b42a4e861a001e848082583900d8ad931196680f24c99f65244aa099277684ea1c09f9c95fd9c9d72ef3eb9839fb3be3e66b330bc9d3213d498c3d61a1fe4b33699f04dce5821a0011c1b4a1581cba2f5575e21e8ffd54eb81c55fe48fdf112df638347755d2323c9578a1466e616e6974650182583900d8ad931196680f24c99f65244aa099277684ea1c09f9c95fd9c9d72ef3eb9839fb3be3e66b330bc9d3213d498c3d61a1fe4b33699f04dce51b0000000205de3093021a00034fed075820c10f0b35710c6a4b30872f5b7c4567e45a40c70a8228b08e84d859ee069aba6a09a1581cba2f5575e21e8ffd54eb81c55fe48fdf112df638347755d2323c9578a1466e616e697465010e81581cded983764fdb27ff993ce0257e64e20cba99348ad3721a59e8c628190f00a2008001818201818200581cded983764fdb27ff993ce0257e64e20cba99348ad3721a59e8c62819f5a21849a5687265666572726572782268747470733a2f2f756e696d61747269782d64656d6f2e6e65746c6966792e6170706972657475726e55524c783368747470733a2f2f756e696d61747269782d64656d6f2e6e65746c6966792e6170702f3f7478486173683d7b7478486173687d657469746c657818446563656e7472616c697a656420546f6b656e2053616c656474797065627478617663312e301902a2a1636d73678978400a0a436f6e736964657220766f74696e672046756e643131206f70656e20736f757263652070726f6a656374733a0a0a2d2047616d654368616e6765723a206f784070656e2d736f757263696e67206e6f7720746f2068656c70204349503330207370656320757067726164650a68747470733a2f2f63617264616e6f2e6964656178407363616c652e636f6d2f632f696465612f3131323436380a0a2d2047616d654368616e6765723a206f70656e2d736f757263696e6720556e696d6174726978207840746f2064656d6f63726174697a65206d756c74697369670a68747470733a2f2f63617264616e6f2e696465617363616c652e636f6d2f632f696465612f31313278403437302f0a0a2d20416e64616d696f202d2047616d656368616e6765722048656c696f73206441505020616e64206170706c69636174696f6e206261636b656e78406420636f757273650a68747470733a2f2f63617264616e6f2e696465617363616c652e636f6d2f632f696465612f3131323231350a0a2d2043617264616e6f207840546f74656d2056323a204f6e626f617264696e672074686520776f726c640a68747470733a2f2f63617264616e6f2e696465617363616c652e636f6d2f632f6978406465612f3131323037310a0a2d2044616e64656c696f6e20506f737467524553542047554920666f7220646576656c6f7065727320616e642073747564656e747840730a68747470733a2f2f63617264616e6f2e696465617363616c652e636f6d2f632f696465612f3131323437330a0a486170707920486f6c6964617973210a0a",
        "signedTxHex":"84a70081825820dfc1cb1e7aeb35b5632e4a7b383ecd8d3426da5ba100f767fb1eeca2addb950d02018382583900feff70b08356d72c571ade218c7e2933235d2cdc37259646013a27d961d11bcf82ebd0ca2afdaf96e11ec71e43ab4e454cbe1495b42a4e861a001e848082583900d8ad931196680f24c99f65244aa099277684ea1c09f9c95fd9c9d72ef3eb9839fb3be3e66b330bc9d3213d498c3d61a1fe4b33699f04dce5821a0011c1b4a1581cba2f5575e21e8ffd54eb81c55fe48fdf112df638347755d2323c9578a1466e616e6974650182583900d8ad931196680f24c99f65244aa099277684ea1c09f9c95fd9c9d72ef3eb9839fb3be3e66b330bc9d3213d498c3d61a1fe4b33699f04dce51b0000000205de3093021a00034fed075820c10f0b35710c6a4b30872f5b7c4567e45a40c70a8228b08e84d859ee069aba6a09a1581cba2f5575e21e8ffd54eb81c55fe48fdf112df638347755d2323c9578a1466e616e697465010e81581cded983764fdb27ff993ce0257e64e20cba99348ad3721a59e8c628190f00a20082825820b495c77a7e6695ee6ad44c330f590ca20e9d740a185a93f1128c4e578a582705584007dd3bf439b1faae7bab74a225336458a200cbaaf4ee067729d01c21e405aefe233ac3d1ad6d6d41327cd66de697c0a69ca631071ec00606c84a41401a59d50582582060d0f59f4d016b13260397822157334c0b591b8787018e837e6393985ee894a758400755217aacc0eeb65d7510c3e7d79f9d83c824f684ee539ef1fb4aae09c849aad7c12d060668b768d2f980da30ddab5a269d30e9d958f2176a958f664ff4090e01818201818200581cded983764fdb27ff993ce0257e64e20cba99348ad3721a59e8c62819f5a21849a5687265666572726572782268747470733a2f2f756e696d61747269782d64656d6f2e6e65746c6966792e6170706972657475726e55524c783368747470733a2f2f756e696d61747269782d64656d6f2e6e65746c6966792e6170702f3f7478486173683d7b7478486173687d657469746c657818446563656e7472616c697a656420546f6b656e2053616c656474797065627478617663312e301902a2a1636d73678978400a0a436f6e736964657220766f74696e672046756e643131206f70656e20736f757263652070726f6a656374733a0a0a2d2047616d654368616e6765723a206f784070656e2d736f757263696e67206e6f7720746f2068656c70204349503330207370656320757067726164650a68747470733a2f2f63617264616e6f2e6964656178407363616c652e636f6d2f632f696465612f3131323436380a0a2d2047616d654368616e6765723a206f70656e2d736f757263696e6720556e696d6174726978207840746f2064656d6f63726174697a65206d756c74697369670a68747470733a2f2f63617264616e6f2e696465617363616c652e636f6d2f632f696465612f31313278403437302f0a0a2d20416e64616d696f202d2047616d656368616e6765722048656c696f73206441505020616e64206170706c69636174696f6e206261636b656e78406420636f757273650a68747470733a2f2f63617264616e6f2e696465617363616c652e636f6d2f632f696465612f3131323231350a0a2d2043617264616e6f207840546f74656d2056323a204f6e626f617264696e672074686520776f726c640a68747470733a2f2f63617264616e6f2e696465617363616c652e636f6d2f632f6978406465612f3131323037310a0a2d2044616e64656c696f6e20506f737467524553542047554920666f7220646576656c6f7065727320616e642073747564656e747840730a68747470733a2f2f63617264616e6f2e696465617363616c652e636f6d2f632f696465612f3131323437330a0a486170707920486f6c6964617973210a0a",
    },

}

const multisig2={
    ...multisig1,    
    transaction:undefined,
    signerVkWitnessHex:undefined,
    foreignVkWitnessHex:undefined,
    "transactions":[
        {
            "txHash":"71cd8d027eb1794afd08000d3ff4fd9eee38c73f54b6f82159b3147949628e92",
        },
        {
            "txHash":"e0bbfe4e9115696f17787f94b82ba06ff25a9b2447ae1d0709c1ec88540648a0",
        },
        {
            "txHash":"0018040840f15041a65a63a8d95c658897cc99ba571f53b19ac060c13aa29c46",
        },                
    ],

}



const testCase1={
    id:'multisig_1234',
    validator:'cardano.vkWitnessHex',
    dltTag:<DLTTag>multisig1.dltTag,
    networkTag:<NetworkTag>multisig1.networkTag,
    txHash:multisig1.transaction.txHash,
    vkHash:multisig1.signer.pubSpendKeyHash,
    path:[
        multisig1.dltTag,
        multisig1.networkTag,
        multisig1.transaction.txHash,
        multisig1.signer.pubSpendKeyHash
    ],
    dataKey:{
        key: '5fa08842b11cca621a39b691ec6b6ae5054c4a251f49ea6b8b00d01ee8445a7da54b287e3deeee900bd70ee31993ca598b079923309e210c9572e03949594bdc',
        path: 'multisig_1234:cardano.vkWitnessHex:cardano/preprod/0018040840f15041a65a63a8d95c658897cc99ba571f53b19ac060c13aa29c46/ded983764fdb27ff993ce0257e64e20cba99348ad3721a59e8c62819'
    },
    vkWitnessHex:multisig1.signerVkWitnessHex,
    store:{
        file:{
            "data": multisig1.signerVkWitnessHex,                                             
            "error": undefined
        },
        updatedAt:Date.now(),
    }

}

const testCase2={
    ...testCase1,
    txHex:multisig1.transaction.txHex,
    validator:'cardano.txHex',
    dataKey:{
        key: 'd84417273f8f79e2e99eb54ed2f61b626b3894367fcb6a368514ea716e832159e5867898844950f2961a19b3e5cd91c4e4e78ad24338d1806c1fe9bab2683970',
        path: 'multisig_1234:cardano.txHex:cardano/preprod/0018040840f15041a65a63a8d95c658897cc99ba571f53b19ac060c13aa29c46'
    },    
    store:{
        file:{
            "data": multisig1.transaction.txHex,                                             
            "error": undefined
        },
        updatedAt:Date.now(),
    }    
}

const testCase3={
    ...multisig2,
    id:'multisig_1234',
    validator:'cardano.TxHashHexList',
    dltTag:<DLTTag>multisig1.dltTag,
    networkTag:<NetworkTag>multisig1.networkTag,
    txHashes:multisig2.transactions.map(x=>x.txHash),
    subPath:['signTxs'],
    path:[
        multisig1.dltTag,
        multisig1.networkTag,
        multisig1.transaction.txHash,
        multisig1.signer.pubSpendKeyHash,
        'signTxs'
    ],
    dataKey:{
        key: 'ad2af9a32d9e0b15907d0bf266b9d79c4193900e37429e0eda00be7bfaa3169e30d1cd5a6c0a5244695a9e2c07191dda5d0d4f053396e37cffebc9825ae12787',
        path: 'multisig_1234:cardano.TxHashHexList:cardano/preprod/signTxs'
    },      
    store:{
        file:{
            "data": multisig2.transactions.map(x=>x.txHash),                                             
            "error": undefined
        },
        updatedAt:Date.now(),
    }        
}



describe('generate hashes', () => {

    test('for cardano.vkWitnessHex data manually', () => {
        const testCase=testCase1;
        const _dataKey=genDataKey({
            id:testCase.id,
            validator:testCase.validator,
            path:[
                testCase.dltTag,
                testCase.networkTag,
                testCase.txHash,
                testCase.vkHash
            ]
        });
        //console.dir({dataKey});
        expect(_dataKey.key).toBe(testCase.dataKey.key);
        expect(_dataKey.path).toBe(testCase.dataKey.path);
      });
    
    test('for cardano.vkWitnessHex data with helper', () => {
        const testCase=testCase1;
        const _dataKey=genVkWitnessHexKey({
            id:testCase.id,
            dltTag:testCase.dltTag,
            networkTag:testCase.networkTag,
            txHash:testCase.txHash,
            vkHash:testCase.vkHash,      
        });
        //console.dir({dataKey});
        expect(_dataKey.key).toBe(testCase1.dataKey.key);
        expect(_dataKey.path).toBe(testCase1.dataKey.path);
    });  
    
    
    
    test('for for cardano.txHex data with helper', () => {
        const testCase=testCase2;
        const _dataKey=genTxHexKey({
            id:testCase.id,
            dltTag:testCase.dltTag,
            networkTag:testCase.networkTag,
            txHash:testCase.txHash,            
        });
        //console.dir({dataKey});
        expect(_dataKey.key).toBe(testCase.dataKey.key);
        expect(_dataKey.path).toBe(testCase.dataKey.path);
    });  
    
    test('for cardano.TxHashHexList data with helper', () => {
        const testCase=testCase3;
        const _dataKey=genTxHashesKey({
            id:testCase.id,
            dltTag:testCase.dltTag,
            networkTag:testCase.networkTag,
            subPath:testCase.subPath,            
        });
        //console.dir({dataKey});
        expect(_dataKey.key).toBe(testCase.dataKey.key);
        expect(_dataKey.path).toBe(testCase.dataKey.path);
    }); 

});
 

describe('validate data', () => {
    
    const validators=cardanoValidatorsFactory(CardanoLib)

    test('for cardano.vkWitnessHex data with helper', () => {
        const testCase=testCase1;
        const validation=validators[testCase.validator]({
            id: testCase.id,
            validator: testCase.validator,
            path: testCase.path,
            store: testCase.store,   
        });
        //console.dir({dataKey});
        expect(validation).toBe(true);
    });  
    
    
    
    test('for for cardano.txHex data with helper', () => {
        const testCase=testCase2;
        const validation=validators[testCase.validator]({
            id: testCase.id,
            validator: testCase.validator,
            path: testCase.path,
            store: testCase.store,   
        });
        //console.dir({dataKey});
        expect(validation).toBe(true);
    });  
    
    test('for cardano.TxHashHexList data with helper', () => {
        const testCase=testCase3;
        const validation=validators[testCase.validator]({
            id: testCase.id,
            validator: testCase.validator,
            path: testCase.path,
            store: testCase.store,   
        });
        //console.dir({dataKey});
        expect(validation).toBe(true);
    }); 

});
 
