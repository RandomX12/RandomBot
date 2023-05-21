"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    data: {
        name: "help",
        description: "Do you need help using the bot ?"
    },
    async execute(interaction) {
        const info = require("../../config.json").info;
        await interaction.reply({
            content: `Website : ${info.website}
commands : ${info.commands}
server   : ${info.server}`,
            ephemeral: true
        });
    }
};
