const { getWalletData } = require('./wallet');
require('dotenv').config();
const { useLogger, logLevels } = require('./logger');
const { toArray, toBoolean } = require('./common');
useLogger();


const getConfig=async()=>{
    const dltTag=process.env.DLT||"cardano";
    const networkTag=process.env.NETWORK||"preprod";
    const defaultAddress={
        'mainnet':'addr1q9faamq9k6557gve35amtdqph99h9q2txhz07chaxg6uwwgd6j6v0fc04n5ehg292yxvs292vesrqqmxqfnp7yuwn7yqczuqwr',
        'preprod':'addr_test1qrl07u9ssdtdwtzhrt0zrrr79yejxhfvmsmjt9jxqyaz0ktp6ydulqht6r9z4ld0jms3a3c7gw45u32vhc2ftdp2f6rqvz02jw',
    }
    const defaultMnemonic="lucky wild glass legal twenty hurry october mountain spatial rain uncle abandon width lady pink";
    const mnemonic=process.env.MNEMONIC || defaultMnemonic;
    const defaultPeers="https://unimatrix01.gamechanger.finance/gun,http://localhost:8765/gun";
    
    const wallet=getWalletData({mnemonic,networkTag,dltTag});
    const useSpend=toBoolean(process.env.SPEND || "true");
    const useStake=toBoolean(process.env.STAKE || "true");

    const fee=process.env.FEE || "2000000";
    const address=process.env.ADDRESS || defaultAddress[networkTag];
    
    return Promise.resolve({
        dltTag,
        networkTag,
        mnemonic,
        fee,
        address,
        useStake,
        useSpend,
        //wallet,
        unimatrixId:process.env.UNIMATRIX_ID||"multisig_1234",
        unimatrixTxSubPath:toArray(process.env.UNIMATRIX_TX_PATH||"signTxs",'/'),
        unimatrixPeers:toArray(process.env.UNIMATRIX_PEERS||defaultPeers,','),
        logLevels,
    });
}

const getGreeting=async()=>{
    const {
        fee,
        address,
        networkTag,
    }=await getConfig();

    const examplesByNetworkTag={
        'mainnet':[
            {
                title:'3 Transactions at once',
                url:'https://beta-wallet.gamechanger.finance/api/2/run/1-H4sIAAAAAAAAA-1YbWvjRhD-K0JfcgdpIu2rFSjl2lJa6B1Hk6MfSigr7cjeRpZk7cqRE_zfO7N2HB_tHVxLKBQHEu3uvD3PzEhD9jENLjSQXqU8eTs2wXk3T8JgWm-q4LrWJ6N37Tz50LqlCYOb0vPUgq8G15MY7b4dXWP9eYKGbWJam_ixXLqQ8GT5t_4GWI1uIJ8wBRha00RTOriDzd6RCeMAPgkLE5J71zRJCUk_dGtnwSauRSdoFtwSknKTWKigxRiNe0DpAWmyxhNrQjckbYeYETlMfTeENx5hP4HD0wEwGlJ5TJeoh7LG-JBuz9Ow6Wm7Y0uKY9QqiXFOq71CPLih1Dwl8xnEIan5IdKHX35-bwJxR81FCL2_urwcnyy-srDsLloIjas3F6bvL78J04_GL75-3D23FGei8N0Y-jF4WnoY1q6CHwBoZ6zF9BFNWuWrojZmuSrulJR6vgYuzTLYVb8oikWxYmFaPGS6Wphprsb7-7lVf6h1VleZaCUs5qxgm2nt8bEGP6xWy2lVt73ejPet3qyqh3F1PyAk4z0Qlt8e075rXLX5ycb45kn2zizhcLIaTYvJ2uBBnsWfdHu73VKKqD3AXmMXwLDj1kNLvrD2xYxrJWpbMl3XRcEryJjUoASwrCoNnoiZsVyz3MgCZpVis7ygUppxco0zw-Z7Eww5VVrEivs5en70Ybjp3kJAcMFch-HVAqabjhZnmcmM4KpWoLkqlFBSM5ZppWotcA9Ks0woLXEleM5zlqEkU7hHLbTTqK-4krjLcFUrgzKuhebckG9m0V6rXFklMc4MV-iTonBz5Mse-dpHxb-1xifiqHE3Q71KZ-iNi0JmnPOMEER7jiuJK1RH_8ghM2qGGARiQhysZjX6zVEqYvyawY4rnnGSqAoZgKI8WNLF372c1cSaM47g-ezfMZKUxQLtckTGVKFnB3YUy2J0Tgwo89pQTpXVxJr25EW_CC-NmawPzMiPiOwKQnbMVn3EFs9jTUhPc-IgcplJrErUEfREnFnU4DtW1Gd4TlXiqlRyr7fPFGJ-icox_CsP_D72lkkROx2zj2s0pxoKRKmol3ea--qh1iz2uUYLhnHFC2DNsBr5AevOj3jKMuVOUofh-4WvJBNScimoPlKKAvNIby3bdRO-wWQVu5Ey-1wVssauIq9A7-kL9RSPX5bZrgd0EbuljjzQr8Z-ZpHn2evX23S7pW9jnDPsSwcPOw2efzp4grkjSymwKrmAiplYrbKyuclNIWdG2czWVQlS1FnOi1xWoixzkbMSBDsNntPgOQ2e0-D5fwwe_qWDh58Gz3_1H8_5aXadZtdpdp1m12l20XXi0eSi7c3k4zVmMK4B-x6GpfOeLifTq9o0Hs6fbwfp437n4sf4rXHtm_2Y2Z4fjr8bhwHa8Gs33PneVBBlzh5dMf6eI3YMuDc4vkr1CzMgqjCMsN8Qtv3etG03thUe0RCET55fjyVO18URue0tDUwaTenjHMKrs8pUC7jYXVxe4FCF6ew1TdW_SNlnpfxZekupjTe9x8mNB7v0xvgfuSB0ZIqWtWtN02yOTJemGrrnO9bd4P80ARR-jsGnxfxIfEsd8idrrlgwAhcAAA',            
                file:'src/gcscript/3Transactions.gcscript',
            },
            {
                title:'A token sale',
                url:'https://beta-wallet.gamechanger.finance/api/2/run/1-H4sIAAAAAAAAA7VWbY-bRhD-K4gvl0iuAyzsmkhVlDaqUrWJot5F_RBF1RoGe3sYbFhsfKf773lmwQ6OmqpRekg2u_Py7Mwzw-7e-_a4Jf-532aN2Vp_5ltjSxb81B290HurK2PpBeQ5DSamrqB9RRlVttGluaPcu6lvqfKudUlzb-rnFXXjhYF7vLLeU6kzaufeTaOrVmeM5R1MWXpL8hraGzoAbHn08gv095XZaNuY3ttDkmsL0KpGPHOERf22buzLFjG5KDgIiBuyXYNA7_0NLKEsdWv9Byg6J81pS1VOVWao5fmXLIxmG1NZU63e1aXJjhO7Sluzp-uT9egGvS5Lfpm27ajh0bZb_kbH17pdv6Yenjnl6UIoGRf5MlJFkaYioyBKFMmYoiBbakjihc6FikKdpLTIZLQIU__BPTN_2Zkyn4Ti5jf9pHJfq82Zlvd__P5OW0tMkL-2dts-f_asO7H8Q06bel6RLU1xnOvt9tkL23MCP94P7wdeqz_RA_o-IE3H0K8IzL9fkX1ylelsTfMpzfMLMucDZyMxV08ZVLctjXhu-FZvBrK5l6DfdRoIFoXwQ__h48PHmV93dttZV8KWmr3J6BciV4g8b6jltuBRuEsLrTe79FYmiVrtSSR6Y_Pddp2m63QX2X59F6hsrfuV7A6HVS7_lvugyIK4Smi9itLo2O9bvPbUNrvdpt8V1VYdu0Oljrvsrtsdmsv4J3zoXJ90Y0KDZJrN8IlwTtyitOtMQ_m1WVXUDLkxjd_VPTP_YGwFRoZ-nzZwO-n0saW_tYpDBTl43fWmNLo5vtJWM7BUscNvV4za2uamfkMWFFh9bZsna-pvah5cBTrQsZCFJCVkKmOZqCgKlJSFijEnqaIglirBKBahCKMAmkBiDiv4KdhLIRPMAowKqaETKlZCaMaOcvgrGcpcJlhngREweRWhJ1j5BGtcFf-FwhtxFJgtYJepAGgiTpNACBFwBM5fYJRgBHPgI4dAywViiBET4oiKqABuCG3s1i8iGnKFTLBGZsiAJPOQsy1-oz4qOGsRCQQvFt-XUcIspvALEVkkU7U4Z8dr5VhdcAbMvNLMqcwVZ81zRlGPkpcCk8U5M8aJXXYpRzbNVl5kC7mrCdspwTnEYRIkqIqzifmNOANnIYasuM8g5yoJuZTJaDcyhZgfo3IR_pNzfpdoQRK7Tgf7GMOdaxgjSsm9PFiO1YPVwvW5gkeEdeNHiDVANcJzrANOfGKZuUu4w_B94ZOM4iQRScz1SZI4BY_81UZDN-ELZi_Xjczs56qwN7qKUYm_00fqKeF2lsXQAyp13VK4PICr0M-Ry_PqqdvCeBNrsfNObwWY3vStuwRZbUrK31GzwRmP-ws2z0KXLc38TVdaA1O3_98at1-_0aZ6OZ5ED7Oz-OeuaXBE_1k3t-0WVyKnM6w5gfwVInYsODqcr0B82VjrBlHZpqNxwrGNc11VdVdlEPHJSl-VX3dLXAHWk-T4NLUM9OFi73fXizkO_mGL_8jsdMuNsVN-nGBgyEFcIPAC7nSY-YWpcEE6_suFa7hhTAw2Omvqk_6fI4PDiP_51P0P_t9yNwH2Fwfk_7LA6djE8wk1Wx0qiQsAAA',            
                file:'src/gcscript/TokenSale.gcscript',
            }
        ],
        'preprod':
        [
            {
                title:'3 Transactions at once',
                url:'https://beta-preprod-wallet.gamechanger.finance/api/2/run/1-H4sIAAAAAAAAA-1YbWvkNhD-K8ZfcgdpIkuytD4o5dpSWugdRy9HP5RwyNY4q8RrO5Kc7Cbsf--MdrPZ0ObgOEKhbCC7kubteWbGHlb3eXSxg_xNLrJ3UxddcBdZ9KYPpolu6EM2BddfZJ96tzDRu2V-nFsIjXcjidHux8l1NhxnaNhnprdZmOqFi5nIFv_qz8P15Dz5hGUE35sumdLBFay2jkycPIQszk3Mbl3XZTVkox9unAWbuR6doFl0C8jqVWahgR5jdO4OpTuk2Q2eWBMHn_UDYkbksBwHH98GhP0ADk89YDSkcp8vUA9lnQkxXx_ncTXSdsOWFKekVRPjglZbhXRwRql5SOYjiF1Si12kT3_8_sFE4o6a8xjH8Ob0dHqw-M7CYjjpIXauXZ2YcTz9IS5_NWH-_f3me01xlhR-mOI4xUDLAP7GNfALAO2MtZg-okmrzxFCLK59x_RUhWCjvY13cx_ZnfdeVyu4XM7bm0VYXMbqcnm9MnfsKo5qZafueh6Vr-5kZ9nlIggjGn1xK8tJ8Jt5w9toR94qf31zx_jlLeIyIQAB-us-H4fONavfbAJhHmTvzQJ2J9eT6TFjKzzgLP3l6_P1mvJEPQL2I7YC-A3BEXryhQ1QzYRWsrU1121bVaIBxksNSgJnTW3wRM6MFZoXpqxg1ig-Kyqqp5mWrnPGr3420ZBTpWUqe7hAz_ch-rPhHUQEF83H6F_NYXk20OKIGWakUK0CLVSlpCo150wr1WqJe1CaM6l0iSspClFwhhKmcI9aaKdRXwlV4o7hqlUGZUJLLYQh39yivVaFsqrEODNcoU-KIsyeL7vnaxsVP1uN34ijxd0M9RrN0JuQVcmEEIwQJHuBqxJXqI7-kQMzaoYYJGJCHLzFWgpVoFSm-C2HDVc8EyRRDTIARXmwpIv_WzlvibXgAsGL2bcxKimLFdoViIyrSs927CiWxeiCGFDmtaGcKquJNe3Ji34RXhoz2e6YkR-Z2FWEbJ-tesIWz1NNSE8L4iCLkpVYlaQj6RtxsqQhNqyoz_CcqiRUrcqt3jZTiPklKsfxs9zxe-qNlTJ1OmYf12hONZSIUlEvbzS31UOtWepzjRYc48oXwMqwGsUO68aPfMgy5a6kDsPnCx9JLstSlJLqU5aywjzSU8s33YRPMFmlbqTMPlaFrLGryCvQc_pCPSXSm2W26QFdpW5pEw_0q7GfeeJ59Pr1Ol-v6d2Yhg3_2unDD9Pnm6ZPNFdkWUosTSGh4SaVrG5sYQpTlTOjLLNtU0MpW1aIqigbWdeFLHgNkh-mz2H6HKbPYfr8P6aP-NrpIw7T5z_97XN8GGCHAXYYYIcBdhhgdLu4N75oe7YM6VYzGteB_QB-4UKgu8r8TWu6AMePl4X0cr9y6WX8zrj-7XbWrI93xz9N3kMf_xz8VRhNA0nm7N6N4-cCsWPArcH-zWqYG4-oop9guyFs273p-2HqGzyiSQjPnn-cahyx8z1y63OamjSa8vsLiK-OGtPM4WRzj3mCkxWWR69ptP5Dyr8oFY_Sc0ptuvjdT2462KQ3xX_igtCRKVq2rjddt9ozXZjGD49Xrpvp_zwBFH6JwfNisSc-pw75GyKRMLsRFwAA',            
                file:'src/gcscript/3Transactions.gcscript',
            },
            {
                title:'A token sale',
                url:'https://beta-preprod-wallet.gamechanger.finance/api/2/run/1-H4sIAAAAAAAAA7VWbW_bNhD-K4K-pAU8VyIp0iowFN2KocPWolhS7ENRFLR4ipnIkkNSjp0g_713lOzKxTqs6CLAFnkvD--eO5G8T8N-A-nz1FfObkI6S4MNDQl-6fdJnrzVrQ3wAuUGBhPbtah9BRW0wenG3oFJLrpraJNz3cA8mfoldecSlsUnabotNLoCP08unG69rggrubVNkywhcbC1cItgy31iTtDft3atg7O7ZIsSowOCth3GM8ewYLfpXHjpMaYYBQWBYgehdxjofbpGS1Q22of0ARV9lBrYQGugrSx4mn_Nwmi2tm2w7eW7rrHVfmLX6mC3cH6wHt1Qr5uGXtb7HhyNNv3yD9i_1n71GnboacCUC66kqM2SqbouS15BxgoFUgDLqqVGiVhowxXLdVHCopJskZfpQ3xm6bK3jZmEEucXu0nlvlWbIy3v__rznQ4BiKB0FcLGP3_2rD-w_JOBdTdvITS23s_1ZvPsRdhRAj_fD-8HWmt3oAfp-4BpRoZ-x8DS-0sIT84qXa1gPqV5fkLmfOBsJObsKYFq72HEi8O3ej2QTb2E-pteI0LAQqR5-vDx4eMs7fqw6UMsoQe3tRX8BhALYYwDT21Bo08BfMhvXJOpvvTeBHMb7lYuZHfOOVXu4Wq3qrdrv74K5dXuZq_vsuuwkXvTNzerIF15JxqTXa0917xSl7ei6DnbripWB7NhtXQ327uMXd2eJjEhRRt90I1ZDZJJSuN3QolRn8JNbx2Yc3vZghsSJC5_qIVm6a0NLdIyNP20i_2k3ce-_t5SDmWk4HW_s43Vbv9KB03AUomI7y8J1Qd30b2BgBQEfR7ckxXsLjoanGU604LLWoLispRCFoqxTElZK4FzkIplQqoCR4LnPGcZajKJc7RCP4X2kssCZxmOaqlRx5VQnGvCZgb9lcylkQWus8ARYtIqXE-wzARrXBX_a4VvjKPG2QLtKpUhGhdlkXHOM4og-nMcFThCc8THHDItFxiDwJgwDlZjx3CZo1bE9WsGQ64o46SRFWYAkngwZIu_Uc9qypozjsHzxY9lVBCLJfrlGBmTpVocs6O1DK7OKQNiXmniVBpFWdOcUNSj5KWQyfqYGeGImF1JkU2zlSfZojzWhOwUpxxEXmQFViXaCHpjnFm04ENW1GcopypxuZTFaDcyhTE_RuUY_hfH_E7RskLETkf2cYzuVEOBUUrq5cFyrB5aLWKfK_RguK54hFgzrEZ-jHXAEQeWibuCOgy_L_wkmSgKXgiqT1GIEnmkr5YN3YRfMHnFbiRmv1SFvLGrCBXoO32knuJxZ1kMPaDK2C11zANxFfYzi3mePY1bGG1iHnfe6dUApxc7H29CQdsGzDtwazzo8RKDm2etGw-zdN03waJp3P-vbdyv32jbvhyPo4fZUfxr7xye03937tpv8F4UdZY0B5BPOcaOC44Ox3sQ3ThW2mFUwfUwTii2ca7btuvbCkV0vMI35ef9Eu8Bq0lydKQGAvpwsvfHO8YcT_9hi_9I7PTLtQ1TfqJgYChCnCDQAvF0mKW1bfGWtP-XW9dwzZgYrHXluoP-nyNDhxH_y6n7H_y_54KC2F8dkP_LAodjE5_Pkn70Ao4LAAA',            
                file:'src/gcscript/TokenSale.gcscript',
            }
        ],
    }
    const examples=examplesByNetworkTag[networkTag];
    return Promise.resolve(`

🖖 Greetings fellow human/ai.

This bot will automatically validate and sign incoming transactions ONLY if these conditions are met:

    1 transaction output MUST send ${fee} lovelaces to address '${address}'
    AND
    key hash MUST be included in transaction's required_signers list

You can create these transactions on your own, or 
you can try these example use cases that works with bot's default settings:

${examples.map(({title,url,file})=>`
    Example: ${title}
        URL: ${url}
        Source code: ${file}
`).join('')}

When doing it on your own, don't forget to match 
UNIMATRIX_ID ,UNIMATRIX_TX_PATH and UNIMATRIX_PEERS between wallets and unimatrix nodes to
be able to decrypt and interact under the same private channel.

Thanks for using Unimatrix Sync!

`);
}

module.exports={
    getConfig,
    getGreeting,
}