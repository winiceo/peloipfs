const {
    web3Home,
    web3Foreign,
    deploymentPrivateKey,
    FOREIGN_RPC_URL,
    RPC_URL,
    GAS_LIMIT,
    GAS_PRICE,
    GET_RECEIPT_INTERVAL_IN_MILLISECONDS
} = require('./web3');
const Tx = require('ethereumjs-tx');
const Web3Utils = require('web3-utils');
const fetch = require('node-fetch');
const assert = require('assert');

async function deployContract(contractJson, args, { from, network, nonce }) {
    let web3,
        url;
    if (network === 'foreign') {
        web3 = web3Foreign;
        url = FOREIGN_RPC_URL;
    } else {
        web3 = web3Home;
        url = RPC_URL;
    }
    const options = {
        from,
        gasPrice: GAS_PRICE
    };
    let instance = new web3.eth.Contract(contractJson.abi, options);
    const result = await instance.deploy({
        data: contractJson.bytecode,
        arguments: args
    }).encodeABI();
    const tx = await sendRawTx({
        data: result,
        nonce: Web3Utils.toHex(nonce),
        to: null,
        privateKey: deploymentPrivateKey,
        url
    });
    if (tx.status !== '0x1') {
        throw new Error('Tx failed');
    }
    instance.options.address = tx.contractAddress;
    instance.deployedBlockNumber = tx.blockNumber;
    return instance;
}


async function sendRawTx({ data, nonce, to, privateKey, url }) {
    try {
        let rawTx = {
            nonce,
            gasPrice: Web3Utils.toHex(GAS_PRICE),
            gasLimit: Web3Utils.toHex(GAS_LIMIT),
            to,
            data
        };

        let tx = new Tx(rawTx);
        tx.sign(privateKey);
        let serializedTx = tx.serialize();
        const txHash = await sendNodeRequest(url, 'eth_sendRawTransaction', '0x' + serializedTx.toString('hex'));
        console.log('pending txHash', txHash);

        const receipt = await getReceipt(txHash, url);

        return receipt;

    } catch (e) {
        console.error(e);
    }
}

async function sendNodeRequest(url, method, signedData) {
    const request = await fetch(url, {
        headers: {
            'Content-type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
            jsonrpc: '2.0',
            method,
            params: [signedData],
            id: 1
        })
    });
    const json = await request.json();
    if (method === 'eth_sendRawTransaction') {
        assert.equal(json.result.length, 66, `Tx wasn't sent ${json}`);
    }
    return json.result;

}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getReceipt(txHash, url) {
    await timeout(GET_RECEIPT_INTERVAL_IN_MILLISECONDS);
    let receipt = await sendNodeRequest(url, 'eth_getTransactionReceipt', txHash);
    //console.log(receipt);
    if (receipt === null) {
        receipt = await getReceipt(txHash, url);
    }
    return receipt;
}

module.exports = {
    deployContract,
    sendNodeRequest,
    getReceipt,
    sendRawTx
};
