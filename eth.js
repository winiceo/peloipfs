const Service = require('egg').Service;
const { sendRawTx } = require('../lib/deploymentUtils');
const { web3, deploymentPrivateKey, RPC_URL } = require('../lib/web3');
const assert = require('assert');

const Pelo = require('../lib/PeloponnesianToken.json');
const PeloAbi = Pelo.abi;
const PeloAddr = '0x1F0cD2832ae03dff036871E10b92D6a6AdB64b74';
const PeloToken = new web3.eth.Contract(PeloAbi, PeloAddr);
const DEPLOYMENT_ACCOUNT_ADDRESS = process.env.DEPLOYMENT_ACCOUNT_ADDRESS;

class EthService extends Service {


    async withdraw() {
        //let rpData = yield app.redis.lpop('redPackages:result');

        const orderJson = await this.app.redis.lpop('orders');
        let order = null;
        if (orderJson) {
            order = JSON.parse(orderJson);
            await this.sendTx({ coin: order.coin, address: order.address, amount: order.amount });
        }


    }



    async sendTx({ coin, address, amount }) {

        console.log(address, amount);
        const myNonce = await web3.eth.getTransactionCount(DEPLOYMENT_ACCOUNT_ADDRESS);

        console.log('nonce ' + myNonce);
        try {
            const encodeData = await PeloToken.methods.transfer(address, parseInt(amount)*1e18)
                .encodeABI({ from: DEPLOYMENT_ACCOUNT_ADDRESS });

            const tx = await sendRawTx({
                data: encodeData,
                nonce: myNonce,
                to: PeloAddr,
                privateKey: deploymentPrivateKey,
                url: RPC_URL
            });
            console.log(tx);
            assert.equal(tx.status, '0x1', 'Transaction Failed');

        } catch (e) {
            console.log(e);
        }


    }


}

module.exports = EthService;
