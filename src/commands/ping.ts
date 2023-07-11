import {SlashCommandBuilder,ChatInputCommandInteraction,CacheType,EmbedBuilder} from "discord.js"
import Command, { reply } from "../lib/Commands"

module.exports = new Command({
    data : new SlashCommandBuilder()
            .setName("ping")
            .setDescription("test the bot"),
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const date = Date.now()
        const version : string = require("../../package.json").version
        await reply(interaction,{
            content : "...",
            ephemeral : true
        })
        const embed = new EmbedBuilder()
        .setColor(0x6dfd7d)
        const after = Date.now()
        embed.setTitle("pong :white_check_mark:  \n \n " + `**${after-date}ms** \n`)
        embed.setFooter({text : `${version}V`})
        await reply(interaction,{
            embeds : [embed],
            content : ""
        })
    },
    ephemeral : true
})