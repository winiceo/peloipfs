
const fs = require('fs');

require('dotenv').config({
    path: __dirname + '/../.env'
});
// Need access to my path and file system
let path = require('path');

let BigNumber = require('bignumber.js');

let csv = require('fast-csv');
let csvStream = csv.format({ headers: true });

let stream = fs.createReadStream('../data/my.csv');



// Ethereum javascript libraries needed
let Web3 = require('web3');
let Tx = require('ethereumjs-tx');
// Rather than using a local copy of geth, interact with the ethereum blockchain via infura.io
// The key for infura.io is in .env
const web3 = new Web3(Web3.givenProvider || 'https://rinkeby.infura.io/' + process.env['INFURA_KEY']);
// Fixed-point notation for number of MFIL which is divisible to 3 decimal places
function financialMfil(numMfil) {
    return Number.parseFloat(numMfil / 1e3).toFixed(3);
}


const eps = require('./contract.json');

// Create an async function so I can use the "await" keyword to wait for things to finish
const main = async () => {
    // This code was written and tested using web3 version 1.0.0-beta.29
    console.log(`web3 version: ${web3.version}`);
    // Who holds the token now?
    let myAddress = '0x382866704b3021bcCb47930603C85637E7F56054';
    // Who are we trying to send this token to?
    let destAddress = '0xfd21AD27B120151B93f550FCF12942E5EcF8852d';
    // MineFIL Token (MFIL) is divisible to 3 decimal places, 1 = 0.001 of MFIL
    let transferAmount = new BigNumber(12456 * 1e18);
    // Determine the nonce
    let count = await web3.eth.getTransactionCount(myAddress);
    console.log(`num transactions so far: ${count}`);
    // MineFILToken contract ABI Array

    // const UpgradebleStormSender = require('../build/contracts/UpgradebleStormSender.json')

    let abiArray = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../build/contracts/UpgradebleStormSender.json'), 'utf-8'));
    // The address of the contract which created MFIL
    let contractAddress = eps.storeProxy.sp_address;

    let contract = new web3.eth.Contract(abiArray.abi, contractAddress, {
        from: myAddress
    });

    // How many tokens do I have before sending?
    // var balance = await contract.methods.balanceOf(myAddress).call();
    // console.log(`Balance before send: ${financialMfil(balance)} MFIL\n------------------------`);
    // // I chose gas price and gas limit based on what ethereum wallet was recommending for a similar transaction. You may need to change the gas price!
    // Use Gwei for the unit of gas price
    // var gasPriceGwei = 12;
    let gasLimit = 6000000;
    // Chain ID of Ropsten Test Net is 3, replace it to 1 for Main Net
    let chainId = 4;

    let currentFee = 8000000000000000;
    const TokenAddress = '0x37ea0939b7f37493003ec823381eaa4f37b1e31e';
    //
    // var addresses_to_send=["0x8de6718ae1d81465931a392ad515de748c8458ea"]
    // var balances_to_send=[100]

    let addPerTx = 160;
    // console.log(addresses_to_send)
    let gasPriceGwei = 300;

    let slice = 2;
    const start = (slice - 1) * addPerTx;
    const end = slice * addPerTx;
    addresses_to_send = addresses_to_send.slice(start, end);
    balances_to_send = balances_to_send.slice(start, end);

    console.log(addresses_to_send.length);



    let encodedData =  contract.methods.multisendToken(TokenAddress, addresses_to_send, balances_to_send).encodeABI({ from: myAddress });


    console.log('gasprice', await web3.eth.getGasPrice());
    let gas = await web3.eth.estimateGas({
        from: myAddress,
        data: encodedData,
        value: currentFee,
        to: eps.storeProxy.sp_address
    });
    console.log('gas', gas);

    let homeNonce = await web3.eth.getTransactionCount(myAddress);
    console.log('deploying storage ' + homeNonce);


    let rawTransaction = {
        'from': myAddress,
        // "nonce": "0x" + count.toString(16),
        'nonce': homeNonce,
        'gasPrice': web3.utils.toHex(10 * 1e9),
        'gasLimit': web3.utils.toHex(gasLimit),
        'to': contractAddress,
        'value': web3.utils.toHex(currentFee),
        'data': encodedData,
        'chainId': chainId
    };
    console.log(`Raw of Transaction: \n${JSON.stringify(rawTransaction, null, '\t')}\n------------------------`);

    console.log(process.env['PRIVATE_KEY']);
    // The private key for myAddress in .env
    let privKey = new Buffer(process.env['PRIVATE_KEY'], 'hex');
    let tx = new Tx(rawTransaction);
    tx.sign(privKey);
    let serializedTx = tx.serialize();
    // Comment out these four lines if you don't really want to send the TX right now
    console.log(`Attempting to send signed tx:  ${serializedTx.toString('hex')}\n------------------------`);


    let receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
    // The receipt info of transaction, Uncomment for debug
    console.log(`Receipt info: \n${JSON.stringify(receipt, null, '\t')}\n------------------------`);
    // The balance may not be updated yet, but let's check
    // balance = await contract.methods.balanceOf(myAddress).call();
    // console.log(`Balance after send: ${financialMfil(balance)} MFIL`);
};



var addresses_to_send = [];
var balances_to_send = [];
let i = 1;
let csvStream1 = csv()
    .on('data', function(data) {
        // console.log(data)
        //  var tem=data.split(',')
        addresses_to_send.push(data[0]);
        balances_to_send.push(data[1] * 1e18);
    })
    .on('end', function() {
        console.log('done');
        csvStream.end();
        main();


    });

stream.pipe(csvStream1);

