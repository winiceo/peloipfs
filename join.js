
const Room = require('ipfs-pubsub-room')
const IPFS = require('ipfs')

const ipfs = new IPFS({
    EXPERIMENTAL: {
        pubsub: true
    },
    config: {
        Addresses: {
            Swarm: [
                '/ip4/47.52.205.219/tcp/4001/ipfs/QmTkEyBAirLk3otHS2RTpJA8w6Yyps8Litq2FzDygDfEy2'
            ]
        }
    }
})


ipfs.on('ready', () => {
    const room = Room(ipfs, 'leven')
    room.broadcast("asdfasdf")

})

