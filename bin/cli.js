#!/usr/bin/env node

import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import converter from "../tools/converter.js"

yargs(hideBin(process.argv))
    .scriptName("mineflayer-video-player")
    .usage('Usage: $0 converter [options]')
    .example('$0 converter -i "Bad Apple.mp4"')
    .command('converter', 'Converts video to a format bot can use.', () => {}, converter)
    .help('h')
    .alias('h', 'help')
    .option('i', {
        alias: 'input',
        describe: 'Load a video file.',
        type: 'string',
        demandOption: true,
        normalize: true,
        nargs: 1
    })
    .option('g', {
        alias: 'gpu',
        describe: 'Enables and uses GPU acceleration for frame extraction.',
        choices: ['cuda', 'cuvid'],
        nargs: 1
    })
    .option('d', {
        alias: 'debug',
        describe: 'Debug mode.',
        default: false,
        defaultDescription: 'false',
        type: 'boolean',
        nargs: 1
    })
    .option('s', {
        alias: 'size',
        describe: 'Set the size of the frames.',
        default: '43x36',
        defaultDescription: '43x36',
        type: 'string',
        nargs: 1
    })
    .option('o', {
        alias: 'output',
        describe: 'Output folder.',
        default: '.\\outFiles\\',
        type: 'string',
        normalize: true,
        nargs: 1
    })
    .option('m', {
        alias: 'multithread',
        describe: 'Multithreading.',
        type: 'boolean',
        default: true,
        defaultDescription: 'true',
        nargs: 1
    })
    .check((argv) => {
        var input = argv.s.split("x")
        if (argv.s.includes("x") !== undefined && input[2] === undefined && !isNaN(parseInt(input[0])) && !isNaN(parseInt(input[1]))) {
            return true
        }
        throw new Error('Size is not in the correct format.')
    })
    .parse()