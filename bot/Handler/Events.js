"use strict";
const fs = require('fs')

module.exports = async Client => {
    fs.readdir(`${process.cwd()}/bot/Events/`, async (Err, Files) => {
        Files.forEach(async Events => {
            const EventsFind = require(`${process.cwd()}/bot/Events/${Events}`)
            const Event = Events.split('.')[0]
            Client.on(Event, EventsFind.bind(null, Client))
        })
    })
}