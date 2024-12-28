import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import * as Jimp from 'jimp'
import * as database from '../libs/sql.js'
import os from 'os'
import cprocess from 'child_process';
import path from 'path'

let iOp = []
let debug = false
let isMultiThread = false
let outFolder = ".\\outFiles\\"
let size = "43x36"
let lastframe = 0
let currentframepixel = 0
let procc = []
let finishedProcess = 0

const setVariables = async (args) => {
    debug = args.debug
    isMultiThread = args.multithread
    if (args?.gpu !== undefined) {
        switch (args.gpu) {
            case "cuda":
                iOp.push("-hwaccel cuda")
                break;
            case "cuvid":
                iOp.push("-c:v h264_cuvid")
                break;
        }
    }
    outFolder = args.output
    size = args.size
    ExtractFrames(args.input)
}

const createFolders = async (videoName) => {
    let arr = ["\\frames\\", "\\schematics\\"]
    arr.forEach((folder) => {
        if (!fs.existsSync(path.resolve(outFolder + folder + videoName))) {
            fs.mkdirSync(path.resolve(outFolder + folder + videoName), { recursive: true })
        }
    })
}

const ExtractFrames = async (videoPath) => {
    var videoName = videoPath.split("\\")[videoPath.split("\\").length - 1].split(".")[0]
    createFolders(videoName)
    ffmpeg(videoPath)
        .inputOptions(iOp)
        .size(size)
        .on('progress', function (progress, n) {
            Debug("Frames Processed: " + progress.frames + " FPS: " + progress.currentFps + " Progress: %" + progress.percent.toFixed(0));
        })
        .save(path.resolve(outFolder + '\\frames\\' + videoName + '\\frame%d.jpg'))
        .on('end', async function () {
            console.log(await FrameCountFile(videoName) + " Frames Extracted")
            console.log("Pixel Recognizer Starting...")
            if (isMultiThread) {
                multiThread(videoName, size)
            } else getPixels(videoName, size)
        })
}

async function FrameCountFile(videoName) {
    return fs.readdirSync(outFolder + "\\frames\\" + videoName).length
}

async function Debug(Info) {
    if (debug) {
        console.log(Info)
    }
}

async function WriteFile(data, frame, videoName) {
    if (!fs.existsSync(outFolder + "\\schematics\\" + videoName + "/" + frame + ".sch")) {
        fs.writeFileSync(outFolder + "\\schematics\\" + videoName + "/" + frame + ".sch", "" + data)
    }
}

const AllColors = async (data, frame, videoName) => {
    var newArray = []
    const colors = await database.ColorDB("colors")
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
                    hMap.set(key, { diff: `${parseInt(value.r) + parseInt(value.g) + parseInt(value.b)}` })
                })
                hMap = new Map([...hMap.entries()].sort((a, b) => parseInt(a[1].diff) - parseInt(b[1].diff)))
                if (newArray[newArray.length - 1]?.includes(hMap.entries().next().value[0] + "?")) {
                    newArray[newArray.length - 1] = hMap.entries().next().value[0] + "?" + (parseInt(newArray[newArray.length - 1].split("?")[1]) + currPixel.repeat)
                }
                else {
                    newArray.push(`${hMap.entries().next().value[0]}?${currPixel.repeat}`)
                }
            }
        } catch (err) { }
    }
    WriteFile(newArray, frame, videoName)
    newArray = []
}

/*
async function BWhite(data, frame, videoName) {
    var newArray = []
    for (var i = 0; i < data.length; i++) {
        try {
            var Default = data[i].r
            if (Default === undefined) {
                newArray.push("*")
            } else if (255 - Default < 0 + Default) {
                if (newArray[newArray.length - 1]?.includes("251?")) {
                    newArray[newArray.length - 1] = "251?" + (parseInt(newArray[newArray.length - 1].split("?")[1]) + data[i].repeat)
                } else {
                    newArray.push("251?" + data[i].repeat)
                }
            } else if (255 - Default > 0 + Default) {
                if (newArray[newArray.length - 1]?.includes("251:15?")) {
                    newArray[newArray.length - 1] = "251:15?" + (parseInt(newArray[newArray.length - 1].split("?")[1]) + data[i].repeat)
                } else {
                    newArray.push("251:15?" + data[i].repeat)
                }
            }
        } catch (err) { }
    }
    WriteFile(newArray, frame, videoName)
    newArray = []
}
*/
async function getPixels(videoName, size) {
    var newArray = [];
    var fpsInterval = setInterval(async () => {
        Debug("Frames Processed: " + currentframepixel + " FPS: " + (currentframepixel - lastframe) + " Progress: %" + ((currentframepixel / await FrameCountFile(videoName)) * 100).toFixed(0))
        lastframe = currentframepixel
    }, 1000)
    const colors = await database.ColorDB("colors")
    var colorArr = []
    colors.forEach((color) => { colorArr.push(color.ID) })
    for (var frame = 1; frame < await FrameCountFile(videoName) + 1; frame++) {
        const image = await Jimp.Jimp.read(outFolder + "\\frames\\" + videoName + "\\frame" + frame + ".jpg")
        for (var yval = 0; yval < size.split("x")[1]; yval++) {
            for (var xval = 0; xval < size.split("x")[0]; xval++) {
                var pixel = Jimp.intToRGBA(image.getPixelColor(xval, yval))
                pixel.repeat = newArray[newArray.length - 1]?.repeat ?? 1
                if (JSON.stringify(newArray[newArray.length - 1]) != JSON.stringify(pixel)) {
                    newArray.push(pixel)
                    newArray[newArray.length - 1].repeat = 1
                } else {
                    newArray[newArray.length - 1].repeat++
                }
            }
            newArray.push("*")
        }
        currentframepixel++
        //BWhite(newArray, frame, videoName)
        AllColors(newArray, frame, videoName)
        newArray = [];
    }
    WriteFile(size + `/${colorArr.join("-")}/` + await FrameCountFile(videoName), "Data", videoName)
    clearInterval(fpsInterval)
    console.log("Current Frame: " + currentframepixel + " FPS: " + (currentframepixel - lastframe) + " Progress: %" + ((currentframepixel / await FrameCountFile(videoName)) * 100).toFixed(0))
    console.log("All Pixels are Recognized")
}


const multiThread = async (videoName, size) => {
    var fpsInterval = setInterval(async () => {
        Debug("Frames Processed: " + currentframepixel + " FPS: " + (currentframepixel - lastframe) + " Progress: %" + ((currentframepixel / await FrameCountFile(videoName)) * 100).toFixed(0))
        lastframe = currentframepixel
    }, 1000)
    const colors = await database.ColorDB("colors")
    var colorArr = []
    colors.forEach((color) => { colorArr.push(color.ID) })
    for (var i = 1; i < os.availableParallelism() + 1; i++) {
        procc.push(cprocess.fork(import.meta.dirname.split("\\").slice(0, -1).join("\\") + "\\libs\\converterThreads.js", [videoName, size, os.availableParallelism(), await FrameCountFile(videoName), btoa(JSON.stringify(colors)), i, outFolder]))
    }
    procc.forEach((process) => {
        process.on("message", (data) => {
            switch (data) {
                case "done":
                    currentframepixel++
                    break;
                case "finished":
                    process.kill()
                    finishedProcess++
            }
        })
    })
    var last = setInterval(async () => {
        if (finishedProcess === os.availableParallelism()) {
            WriteFile(size + `/${colorArr.join("-")}/` + await FrameCountFile(videoName), "Data", videoName)
            clearInterval(fpsInterval)
            clearInterval(last)
            console.log("Current Frame: " + currentframepixel + " FPS: " + (currentframepixel - lastframe) + " Progress: %" + ((currentframepixel / await FrameCountFile(videoName)) * 100).toFixed(0))
            console.log("All Pixels are Recognized")
        }
    }, 100)
}

export default setVariables