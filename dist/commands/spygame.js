"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
module.exports = {
    data: {
        name: "spygame",
        description: "Get Spy Game commands and rules"
    },
    async execute(interaction) {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`Spy Game`)
            .setThumbnail("https://media.istockphoto.com/id/846415384/vector/spy-icon.jpg?s=612x612&w=0&k=20&c=VJI5sbn-wprj6ikxVWxIm3p4fHYAwb2IHmr7lJBXa5g=")
            .addFields({ name: "Agents's objectif", value: "Is to find out who the spy is and vote for him" })
            .addFields({ name: "Spy's objectif", value: "Is not caught by agents" })
            .addFields({ name: "rules of the game :", value: "- Don't tell anyone about the secret word \n- You can ask someone about the color, shape and etc... of the secret word \n- After the game is over, vote for who you think is the spy" })
            .addFields({ name: "commands", value: "/create_spygame  => to create a Spy Game \n/leave_spygame  => to leave Spy Game \n/spygame_ask  => ask someone about the secret word \n/spygame_answer  => answer to someone question \n/spygame_vote  => vote for who you think is the spy \n/spygame_remove_vote  => remove your vote" });
        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
