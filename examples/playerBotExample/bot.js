import mineflayer from "mineflayer"
import mvp from "../../index.js" // You should require mineflayer-video-player here instead of "../index.js"

if (process.argv.length < 4 || process.argv.length > 6) {
    console.log('Usage : node bot.js <host> <port> <version> [<name>]')
    process.exit(1)
}

const bot = mineflayer.createBot({
    host: process.argv[2],
    port: parseInt(process.argv[3]),
    version: process.argv[4],
    username: process.argv[5] ? process.argv[5] : 'player',
})
  
bot.loadPlugin(mvp)

bot.once('spawn', () => {
    bot.on("chat", (username, message) => {
        if (message === "play" && !bot.video.isPlaying && bot.player.gamemode === 1) {
            bot.video.play("E:\\outFiles\\outFiles\\schematics\\lagtrain") // You need to hardcode the path to the schematic files here.
        }
    })
})