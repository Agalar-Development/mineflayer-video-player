import childProcess from 'child_process';

function inject(bot) {
  bot.video = {}
  /**
  * 
  * @param {string} filePath
  * Path to the folder where the schematic files are located.
  * The path should look like this ``..\schematics\videoName\``
  * @description
  * Bot needs operator permission to run this function
  * also it needs to be in creative mode.
  *
  * WARNING: Do not start multiple videos at the same time. You can check if the bot is playing a video by checking ``bot.video.isPlaying``.
  *
  * You can abort video anytime using default node ``child_process`` api. Example: ``bot.video.process.kill()``.
  */
  function play(filePath) {
    bot.creative.startFlying()
    var internalX = 0
    let internalY = 0
    bot.video.isPlaying = true
    let oldframe = 0
    let frame = 0
    bot.chat(`/bossbar add 0 "FPS"`)
    bot.chat(`/bossbar set minecraft:0 color red`)
    bot.chat(`/bossbar set minecraft:0 players @a`)
    bot.chat(`/bossbar set minecraft:0 max 32`)
    var FPSCounter = setInterval(() => {
      bot.chat(`/bossbar set minecraft:0 value ${(frame - oldframe)}`)
      bot.chat(`/bossbar set minecraft:0 name "FPS: ${(frame - oldframe)}"`)
      oldframe = frame
    }, 1000)
    bot.video.process = childProcess.fork(import.meta.dirname.split("\\").slice(0, -1).join("\\") + "\\libs\\schematicThread.js", [filePath])
    bot.video.process.on("message", async (newarray) => {
      newarray.forEach((element) => {
        if (element == "*") {
          internalY++
          internalX = 0
        } else if (element.split("?")[1] == "1") {
          bot.chat(`/setblock ~${internalX} ~ ~${internalY} ` + element.split("?")[0])
          internalX++
        } else {
          bot.chat(`/fill ~${internalX} ~ ~${internalY} ~${internalX + parseInt(element.split("?")[1])} ~ ~${internalY} ` + element.split("?")[0])
          internalX = internalX + parseInt(element.split("?")[1])
        }
      })
      internalY = 0
      frame++
    })
    bot.video.process.on("exit", () => {
      bot.video.isPlaying = false
      clearInterval(FPSCounter)
      console.log("Video played.")
    })
    bot.on("error", () => {
      bot.video.process.kill()
    })
  }
  bot.video.play = play
  bot.video.isPlaying = false
}

export default inject