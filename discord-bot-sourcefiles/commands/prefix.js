const discord = require("discord.js");
const fs = require("fs");
const app = require("../../api/app");

module.exports.run = async (bot, message, args, prefix) => {

    if (!message.member.hasPermission("ADMINISTRATOR")) return message.reply("Geen Toegang!");

    if (!args[0]) return message.reply(`Gebruik: ${prefix}prefix <prefix hier>`);

    var prefixes = JSON.parse(fs.readFileSync("./prefixes.json"));

    prefixes[message.guild.id] = {
        prefixes: args[0]
    };

    fs.writeFileSync("./prefixes.json", JSON.stringify(prefixes), err => {
        if (err) console.log(err);
    });

    var stringEmbed = new discord.RichEmbed()
        .setColor("#F00")
        .setTitle("Prefix Gezet")
        .setDescription(`Prefix aangepast naar ${args[0]}.\n Door: `, message.author.name);

    const logs = message.guild.channels.find(`name`, "logs");

    logs.send(stringEmbed);

    app.addLog({
      "log_type": "Prefix Chance",
      "log_message": "Prefix Chanced to: " + args[0],
      "log_date": Date.now(),
      "log_action": ""
    });
}

module.exports.help = {
    name: "prefix"
}
