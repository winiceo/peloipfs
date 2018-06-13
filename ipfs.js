
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

// IPFS node is ready, so we can start using ipfs-pubsub-room
ipfs.on('ready', () => {
    const fileHash="QmYmTqFXGgAbtYBxSd7od1fvnht44xNfteXHgS7zfaBVPs"
    console.log(ipfs.id().then(a=>{
        ipfs.files.get(fileHash, function (err, files) {
            console.log(err)
            console.log(files)
            files.forEach((file) => {
                console.log(file.path)
                console.log("File content >> ",file.content.toString('utf8'))
            })
        })
    }))

})
