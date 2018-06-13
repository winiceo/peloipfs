const fs = require('fs');

const Web3Utils = require('web3-utils');
require('dotenv').config({
    path: __dirname + '/.env1'
});
const BN = require('bignumber.js');

const assert = require('assert');
const { sendRawTx } = require('./deploymentUtils');
const { web3, deploymentPrivateKey, RPC_URL } = require('./web3');


const HOME_GAS_PRICE = Web3Utils.toWei(process.env.HOME_GAS_PRICE, 'gwei');

const lrc = require('./PeloponnesianToken.json');

const lrcAbi = lrc.abi;

const lrcAddr = '0x1F0cD2832ae03dff036871E10b92D6a6AdB64b74';

const LrcContract = new web3.eth.Contract((lrcAbi), lrcAddr);



let csv = require('fast-csv');
let csvStream = csv.format({ headers: true });

let stream = fs.createReadStream('./my.csv');
const sentAddrsFile = 'sent-addrs.txt';
const errorFile = 'sent-error.txt';
const hashFile = 'sentHash.txt';



// const contract=require("./contract.json")

const {
    DEPLOYMENT_ACCOUNT_ADDRESS,
    REQUIRED_NUMBER_OF_VALIDATORS,
    HOME_OWNER_MULTISIG,
    HOME_UPGRADEABLE_ADMIN_VALIDATORS,
    HOME_UPGRADEABLE_ADMIN_BRIDGE,
    HOME_DAILY_LIMIT,
    HOME_MAX_AMOUNT_PER_TX,
    HOME_MIN_AMOUNT_PER_TX,
    HOME_REQUIRED_BLOCK_CONFIRMATIONS
} = process.env;


async function send(address, amount) {



    console.log('nonce ' + leven.homeNonce);
    try {
        const upgradeToBridgeVHomeData = await
        LrcContract.methods.transfer(address, amount)
            .encodeABI({ from: DEPLOYMENT_ACCOUNT_ADDRESS });

        const txUpgradeToBridgeVHome = await sendRawTx({
            data: '0xe585ade4b880e7a59de7a68fe8afade6b58be8af95',
            nonce: leven.homeNonce,
            to: address,
            privateKey: deploymentPrivateKey,
            url: RPC_URL
        });

        fs.appendFileSync(hashFile, txUpgradeToBridgeVHome.hash + '\n');

        assert.equal(txUpgradeToBridgeVHome.status, '0x1', 'Transaction Failed');

        leven.homeNonce++;
    } catch (e) {
        fs.appendFileSync(sentAddrsFile, address + ',' + amount + '\n');
        fs.appendFileSync(errorFile, e + '\n');


    }


}

async function over() {

    for (data in leven.senders) {
        await send(leven.senders[data][0], leven.senders[data][1]);
    }
}


const leven = {
    senders: []
};

function main() {
    let csvStream = csv()
        .on('data', function(data) {


            leven.senders.push(data);

        })
        .on('end', function() {

            over();

        });

    stream.pipe(csvStream);

}
async function run() {
    leven.homeNonce = await web3.eth.getTransactionCount(DEPLOYMENT_ACCOUNT_ADDRESS);
    main();



}

run();
