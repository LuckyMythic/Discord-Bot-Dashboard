const discord = require("discord.js");
const app = require("../../api/app");
const fs = require('fs');

module.exports.run = async (bot, message, args, prefix) => {

    // Id van category van tickets.
    const categoryId = "499272331793793024";

    // Als bericht in ticket kanaal is dan verwijder kanaal ander zend bericht
    if (message.channel.parentID == categoryId && message.member.roles.find("name", "Support Team")) {
        message.channel.delete();
    } else {
        message.channel.send("Gelieve dit commando in een ticket kanaal te doen. En een member van het Support Team te zijn.");
        return;
    }

    app.addLog({
        "log_type": "Ticket Closed",
        "log_message": "Ticket Got Closed by: " + message.author.username + "#" + message.author.discriminator,
        "log_date": Date.now(),
        "log_action": "Ticket Created by: " + message.channel.name
    });

    var embedCloseTicket = new discord.RichEmbed()
        .setTitle("Hoi, " + message.channel.name)
        .setDescription(`Je ticket is gemarkeerd als **compleet**. Wil je een nieuwe maken doe dan ${prefix}ticket`)
        .setFooter("Ticket Gesloten");

    // Vind kanaal voor de logs.
    var logChannel = message.guild.channels.find("name", "logs");
    if (!logChannel) return message.channel.send("Log Kanaal bestaat niet");

    logChannel.send(embedCloseTicket);

}

module.exports.help = {
    name: "close"
}
