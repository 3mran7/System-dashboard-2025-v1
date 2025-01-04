"use strict";
const { glob } = require('glob')
const { promisify } = require('util')
const Glob = promisify(glob)

module.exports = async Client => {
    const Çɱɗ = Glob(`${process.cwd()}/bot/Commands/**/*.js`)
    ;(await Çɱɗ).map((Command) => {
        const Cmd = require(Command)
        if(!Cmd.name) return;
        Client.Çɱɗ.set(Cmd.name, Cmd)
    })
}