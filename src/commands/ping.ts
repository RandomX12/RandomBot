import {SlashCommandBuilder,ChatInputCommandInteraction,CacheType,EmbedBuilder} from "discord.js"

module.exports = {
    data : new SlashCommandBuilder()
            .setName("ping")
            .setDescription("test the bot"),
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const date = Date.now()
        const version : string = require("../../package.json").version
        await interaction.reply({
            content : "...",
            ephemeral : true
        })
        const embed = new EmbedBuilder()
        .setColor(0x6dfd7d)
        const after = Date.now()
        embed.setTitle("pong :white_check_mark:  \n \n " + `**${after-date}ms** \n`)
        embed.setFooter({text : `${version}V`})
        await interaction.editReply({
            embeds : [embed],
            content : ""
        })
    }
}