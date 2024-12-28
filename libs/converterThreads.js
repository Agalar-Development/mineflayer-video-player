import * as Jimp from "jimp"
import fs from "fs"

async function WriteFile(data, frame, videoName, outFolder) {
    if (!fs.existsSync(outFolder + "\\schematics\\" + videoName + "/" + frame + ".sch")) {
        fs.writeFileSync(outFolder + "\\schematics\\" + videoName + "/" + frame + ".sch", "" + data)
    }
}

const AllColors = async (data, frame, videoName, colors, outFolder) => {
    var newArray = []
    for (var i = 0; i < data.length; i++) {
        var hMap = new Map()
        try {
            var currPixel = data[i]
            if (currPixel.r === undefined) {
                newArray.push("*")
            } else {
                colors.forEach((color) => {
                    hMap.set(color.ID, {
                        r: `${Math.abs(parseInt(currPixel.r) - parseInt(color.r))}`,
                        g: `${Math.abs(parseInt(currPixel.g) - parseInt(color.g))}`,
                        b: `${Math.abs(parseInt(currPixel.b) - parseInt(color.b))}`
                    })
                })
                hMap.forEach((value, key) => {
                    hMap.set(key, { diff: `${parseInt(value.r) + parseInt(value.g) + parseInt(value.b)}`}  )
                })
                hMap = new Map([...hMap.entries()].sort((a, b) => parseInt(a[1].diff) - parseInt(b[1].diff)))
                if (newArray[newArray.length - 1]?.includes(hMap.entries().next().value[0] + "?")) {
                    newArray[newArray.length - 1] = hMap.entries().next().value[0] + "?" + (parseInt(newArray[newArray.length - 1].split("?")[1]) + currPixel.repeat)
                }
                else {
                    newArray.push(`${hMap.entries().next().value[0]}?${currPixel.repeat}`)
                }
            }
        } catch (err) {}
    }
    WriteFile(newArray, frame, videoName, outFolder)
    newArray = []
}

async function getPixels(videoName, size, workers, allframes, colors, thread, outFolder) {
    var newArray = [];
    var currThread = parseInt(thread)
    try {
    for (currThread; currThread < allframes + 1; currThread = (currThread + parseInt(workers))) {
        const image = await Jimp.Jimp.read(outFolder + "\\frames\\" + videoName + "\\frame" + currThread + ".jpg")
        for (var yval = 0; yval < size.split("x")[1]; yval++) {
            for (var xval = 0; xval < size.split("x")[0]; xval++) {
                var pixel = Jimp.intToRGBA(image.getPixelColor(xval, yval))
                pixel.repeat = newArray[newArray.length - 1]?.repeat?? 1
                if (JSON.stringify(newArray[newArray.length - 1]) != JSON.stringify(pixel)) {
                    newArray.push(pixel)
                    newArray[newArray.length - 1].repeat = 1
                } else {
                    newArray[newArray.length - 1].repeat++
                }
            }
            newArray.push("*")
        }
        AllColors(newArray, currThread, videoName, colors, outFolder)
        newArray = [];
        process.send("done")
    }
    } catch (err) {
        process.send("finished")
    }
}

getPixels(process.argv[2], process.argv[3], process.argv[4], process.argv[5], JSON.parse(atob(process.argv[6])), process.argv[7], process.argv[8])