import fsp from 'fs/promises'
import fs from 'fs'
import minecraftData from 'minecraft-data'

async function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

async function Video(filePath) {
    console.log("Build Starting...");
    const data = fs.readFileSync(filePath + "\\Data.sch", 'utf8')
    console.log("Build Config Loaded. Initializing...");
    var dataarray = data.split('/')
    var intarray = dataarray[1].split("-")
    var colorDecodeArray = []
    var FrameCount = dataarray[2]
    var blocksinglearray = []
    for (var t = 0; t < intarray.length; t++) {
      console.log("Decoding Block...");
      var BlockData = minecraftData.legacy.pc.blocks[intarray[t]]?? minecraftData.legacy.pc.blocks[intarray[t] + ":0"]
      console.log("Decoded Block: " + BlockData);
      colorDecodeArray.push(BlockData)
    }
    var newarray = [];
    for (var i = 1; i < FrameCount; i++) {
      await fsp.readFile(filePath + `\\${i}` + ".sch", 'utf8').then(async (Data) => {
        blocksinglearray = Data.split(",")
        for (var l = 0; l < blocksinglearray.length; l++) {
          for (var j = 0; j < intarray.length; j++) {
            if (blocksinglearray[l].split("?")[0] == intarray[j]) {
              newarray.push(blocksinglearray[l].replace(intarray[j], colorDecodeArray[j]))
            } else if (blocksinglearray[l] == "*" && j == 0) {
              newarray.push("*")
            }
          }
        }
      })
    process.send(newarray)
    newarray = []
    await sleep((1000 / 32))
  }
  process.exit(0)
}

Video(process.argv[2])