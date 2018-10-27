const discord = require("discord.js");
const app = require("../../api/app");
const fs = require('fs');

module.exports.run = async (bot, message, args) => {

    // ID van de categorie van de tickets.
    const categoryId = "499272331793793024";

    // Verkrijg Gebruikersnaam
    var userName = message.author.username;
    // Verkrijg discriminator
    var userDiscriminator = message.author.discriminator;

    // Als ticket al gemaakt is
    var bool = false;

    // Kijk na als ticket al gemaakt is.
    message.guild.channels.forEach((channel) => {
        // Als ticket is gemaakt, zend bericht.
        if (channel.name == "ticket-" + message.author.id && channel.parentID === categoryId) {
            message.channel.send("Je hebt al een ticket aangemaakt");
            bool = true;
        }

    });

    // Als ticket return code.
    if (bool == true) return;

    var embedCreateTicket = new discord.RichEmbed()
        .setTitle("Hoi, " + message.author.username)
        .setFooter("Support kanaal wordt aangemaakt");

    message.channel.send(embedCreateTicket);

    // Maak kanaal en zet in juiste categorie.
    message.guild.createChannel("ticket-" + message.author.id, "text").then((createdChan) => { // Maak kanaal

        createdChan.setParent(categoryId).then((settedParent) => { // Zet kanaal in category.

            // Zet perms voor iedereen
            settedParent.overwritePermissions(message.guild.roles.find('name', "@everyone"), { "READ_MESSAGES": false });
            // Zet perms voor de gebruiker die ticket heeft aangemaakt.
            createdChan.overwritePermissions(message.author, {

                "READ_MESSAGES": true, "SEND_MESSAGES": true,
                "ATTACH_FILES": true, "CONNECT": true,
                "CREATE_INSTANT_INVITE": false, "ADD_REACTIONS": true

            });

            var embedParent = new discord.RichEmbed()
                .setTitle("Hoi, " + message.author.username.toString())
                .setDescription("Zet hier je vraag/bericht/bestelling");

            settedParent.send(embedParent);

            app.addLog({
              "log_type": "New Ticket Created",
              "log_message": "New Ticket Created by: " + userName + "#" + userDiscriminator,
              "log_date": Date.now(),
              "log_action": ""
            });

            var ticket = JSON.parse(fs.readFileSync("./discord-bot-sourcefiles/tickets.json"));

            ticket[`ticket-${message.author.id}`] = {
              ticketName: userName + "#" + userDiscriminator,
              ticketStatus: "opened"
            };

            fs.writeFileSync("./discord-bot-sourcefiles/tickets.json", JSON.stringify(ticket), err => {
              if (err) console.log(err);
            });

        }).catch(err => {
            console.error(err);
            message.channel.send("Er is iets fout gelopen.");
        });

    }).catch(err => {
        console.error(err);
        message.channel.send("Er is iets fout gelopen.");
    });

}

module.exports.help = {
    name: "ticket"
}
