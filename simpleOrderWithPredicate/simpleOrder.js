
import Web3 from 'web3';
import { LimitOrderBuilder, LimitOrderProtocolFacade, LimitOrderPredicateBuilder, PrivateKeyProviderConnector } from '@1inch/limit-order-protocol';
import fetch from 'node-fetch'; // specifically version node-fetch@2.6.7

let infuraKey = "...";
const web3 = new Web3('https://mainnet.infura.io/v3/' + infuraKey);
const connector = new PrivateKeyProviderConnector("...", web3); //it's usually best not to store the private key in the code as plain text, encrypting/decrypting it is a good practice
const contractAddress = '0x119c71D3BbAC22029622cbaEc24854d3D32D2828';                                                        //this is the limit order contract address for the mainnet
const walletAddress = '...';                                                          //your wallet address placing the order          
const chainId = 1;

const limitOrderBuilder = new LimitOrderBuilder(
    contractAddress,
    chainId,
    connector
);

const fromToken = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';                  //this is the token address that you want to sell
const toToken = '0xdAC17F958D2ee523a2206206994597C13D831ec7';                    //this is the token address that you want to buy
const fromAmount = '100000000';                                                          //this is the amount of tokens you want to sell, make sure it's in minimum divisible units
const toAmount = '100000000';                                                //this is how much of the to token you want to buy. make sure it's in minimum divisible units
const seconds = 60;                                                              //this is how many seconds the order is active for, it can be any non-negative number


const limitOrderProtocolFacade = new LimitOrderProtocolFacade(
    contractAddress,
    connector
);
const limitOrderPredicateBuilder = new LimitOrderPredicateBuilder(
    limitOrderProtocolFacade
);

const {
    timestampBelow,
    nonceEquals,
    and
} = limitOrderPredicateBuilder;

const timeStamp = timestampBelow(Math.round(Date.now() / 1000) + seconds);
const nonce = nonceEquals(walletAddress, 0);
const predicateCallData = and(timeStamp, nonce);

const limitOrder = limitOrderBuilder.buildLimitOrder({
    makerAssetAddress: fromToken,
    takerAssetAddress: toToken,
    makerAddress: walletAddress,
    takerAddress: '0x0000000000000000000000000000000000000000',
    makerAmount: fromAmount,
    takerAmount: toAmount,
    predicate: predicateCallData,
    permit: '0x',
    interaction: '0x',
    // allowedSender: '0x0000000000000000000000000000000000000000',

    // makerAssetData: '0x',
    // takerAssetData: '0x',
});

let limitOrderTypedData = limitOrderBuilder.buildLimitOrderTypedData(
    limitOrder
);

const limitOrderSignature = limitOrderBuilder.buildOrderSignature(
    walletAddress,
    limitOrderTypedData
);
const limitOrderHash = limitOrderBuilder.buildLimitOrderHash(
    limitOrderTypedData
);


/*
    * The following code is for placing the order with a call to the 1inch API
    * this can be modified to take in the data, for now the data is hardcoded above
*/
async function orderPlace() {

    const signature = await limitOrderSignature;
    const data = {
        orderHash: limitOrderHash,
        //orderMaker: walletAddress,
        //createDateTime: Date.now(),
        signature: signature,
        //makerAmount: fromAmount,
        //takerAmount: toAmount,
        data: limitOrder,
        // orderType: 'active',
        // chainId: chainId
    };
    console.log(JSON.stringify(data, null, 2));
    // console.log("\nPosting to https://limit-orders.1inch.io/v2.0/1/limit-order");

    let fetchPromise = await fetch("https://limit-orders.1inch.io/v2.0/1/limit-order", {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "content-type": "application/json",
        },
        "data": JSON.stringify(data),
        "method": "POST"
    }).then((res) => {
        console.log(res.status);
        return res.json()
    }).then((jsonData => {
        console.log(jsonData);
    }));


    try {
        console.log("\n\n" + (fetchPromise.data));
    } catch (e) { }
}

orderPlace();
