require('dotenv').config();
var exports = module.exports = {};

// --== Require ==--
const fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("../config.json");
const botDataJson = require("./../botData.json");
const botCommands = require("./bot-commands.json");
const now = require("performance-now");

// --== Bot And Commands ==--
const discord = require("discord.js");
const bot = new discord.Client();
bot.commands = new discord.Collection();
bot.aliases = new discord.Collection();

// --== File Manager (Command Handler) ==--

const load = (dir = "./commands/") => {

	readdirSync(dir).forEach(dirs => {
	// we read the commands directory for sub folders and filter the files with name with extension .js
		const commands = readdirSync(`${dir}${sep}${dirs}${sep}`).filter(files => files.endsWith(".js"));

		// we use for loop in order to get all the commands in sub directory
		for (const file of commands) {
		// We make a pull to that file so we can add it the bot.commands collection
			const pull = require(`${dir}/${dirs}/${file}`);
			// we check here if the command name or command category is a string or not or check if they exist
			if (pull.help && typeof (pull.help.name) === "string" && typeof (pull.help.category) === "string") {
				if (bot.commands.get(pull.help.name)) return console.warn(`${warning} Two or more commands have the same name ${pull.help.name}.`);
				// we add the the comamnd to the collection, Map.prototype.set() for more info
				bot.commands.set(pull.help.name, pull);
				// we log if the command was loaded.
				console.log(`${success} Loaded command ${pull.help.name}.`);

			}
			else {
			// we check if the command is loaded else throw a error saying there was command it didn't load
				console.log(`${error} Error loading command in ${dir}${dirs}. you have a missing help.name or help.name is not a string. or you have a missing help.category or help.category is not a string`);
				// we use continue to load other commands or else it will stop here
				continue;
			}
			// we check if the command has aliases, is so we add it to the collection
			if (pull.help.aliases && typeof (pull.help.aliases) === "object") {
				pull.help.aliases.forEach(alias => {
					// we check if there is a conflict with any other aliases which have same name
					if (bot.aliases.get(alias)) return console.warn(`${warning} Two commands or more commands have the same aliases ${alias}`);
					bot.aliases.set(alias, pull.help.name);
				});
			}
		}

	});
};

// we call the function to all the commands.
load();

const chalk = require('chalk');

const app = require("./../api/app");

const commandPrefix = config.prefix;

// Executed when the bot is ready!
client.on('ready', () => {
    // Console output for showing that the bot is running.
    console.log(chalk.greenBright('\n>> Bot is ready!'));
    console.log('>> Logged in as ' + client.user.username);
    console.log('>> Running on version ' + botDataJson.bot_version);
    console.log('>> Current game: ' + botDataJson.bot_game);
    console.log('>> Current status: ' + botDataJson.bot_status);
	  console.log('>> Current prefix: ' + commandPrefix);


    client.user.setGame(botDataJson.bot_game);

    client.user.setStatus(botDataJson.bot_status);

    app.startApp(client);
});

// Executed when message event
client.on('message', async message => {
    const prefix = bot.config.prefix;
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const cmd = args.shift().toLowerCase();

	let command;

	if (message.author.bot || !message.guild) return;

	// If the message.member is uncached, message.member might return null.
	// This prevents that from happening.
	// eslint-disable-next-line require-atomic-updates
	if (!message.member) message.member = await message.guild.fetchMember(message.author);

	if (!message.content.startsWith(prefix)) return;

	if (cmd.length === 0) return;
	if (bot.commands.has(cmd)) command = bot.commands.get(cmd);
	else if (bot.aliases.has(cmd)) command = bot.commands.get(bot.aliases.get(cmd));

	if (command) command.run(bot, message, args);
	
    if(message.channel.type === "dm"){
        let time = Date.now();
        app.dmNotification(senderUsername, content, time);
    }
});

client.login(config.token);

/**
 * Set a game status for the bot.
 *
 * @param game - Game to be set for the bot.
 * @param maintenanceChange - Default: false. Set it to true when this function here is used for maintenance function
 * @param t0 - Number of milliseconds of the process is running. Use for that the function now() (npm module performance-now, added in 0.0.6.1)
 * @since 0.0.1
 *
 * @public
 */
exports.setGameStatus = function (/**String*/ game,/**boolean*/maintenanceChange,/**Number*/ t0) {

    let gameBeforeChanging = client.user.localPresence.game.name;
    client.user.setGame(game);

    console.log("\n>> Bot Change > Game status set to: " + game);

    if(maintenanceChange === false) {

        fs.readFile("./botData.json", "utf-8", function (err, data) {
            if (err) throw err;
            let botData = JSON.parse(data);

            botData.bot_game = game;

            fs.writeFile('./botData.json', JSON.stringify(botData, null, 3), 'utf-8', function (err) {
                if (err) throw err;
                console.log(chalk.greenBright(">> Successfully edited botData.json. Followed values were changed in botData.json:"));
                console.log(chalk.yellowBright(">> game: ") + chalk.redBright(gameBeforeChanging) + " -> " + chalk.greenBright.bold(game));

                setTimeout(() =>{
                    app.addLog({
                        "log_type" : "info",
                        "log_message" : "Successfully edited botData.json.",
                        "log_date" : Date.now(),
                        "log_action" : "Changed value: game"
                    });
                }, 50);

            })
        });

        let t1 = now();
        setTimeout(() =>{
            app.addLog({
                "log_type" : "info",
                "log_message" : "Changed game status value",
                "log_date" : Date.now(),
                "log_action" : "function call took " + (t1-t0).toFixed(3) + "ms"
            });
        }, 70);
        setTimeout(() =>{
            app.addLog({
                "log_type" : "success",
                "log_message" : "Successfully changed game status of bot.",
                "log_date" : Date.now(),
                "log_action" : "Changed it from " + gameBeforeChanging + " to " + game + "."
            });
        }, 90);

    }
};

/**
 * Set a status for the bot (online | idle | dnd | invisible)
 *
 * @param status - Status of the bot.
 * @param maintenanceChange - Default: false. Set it to true when this function here is used for maintenance function
 * @see {@link https://discord.js.org/#/docs/main/stable/typedef/PresenceStatus|Discord.js Docs -> PresenceStatus}
 * @since 0.0.1
 *
 * @public
 */
exports.setBotStatus = function (/**String*/ status,/**boolean*/maintenanceChange) {

    // Store status in a let before the change
    let statusBeforeChanging = client.user.localPresence.status;

    if(status != "online" && status != "idle" && status != "invisible" && status != "dnd" ){
        console.error("\n>> Bot Error: Invalid status to set! Use only the 4 vaild ones!" +
            "\n>> PresenceStatus: https://discord.js.org/#/docs/main/stable/typedef/PresenceStatus" +
            "\n>> Sent value: " + status);
    }else{
        // Setting the new value
        client.user.setStatus(status);
        // Output successful notification
        console.log(">> Bot Change > Status set to: " + status);

        if(maintenanceChange === false) {

            // Change value in botData.json
            fs.readFile("./botData.json", "utf-8", function (err, data) {
                if (err) throw err;
                let botData = JSON.parse(data);

                // Setting new status value
                botData.bot_status = status;

                // Writing new value into the json file
                fs.writeFile('./botData.json', JSON.stringify(botData, null, 3), 'utf-8', function (err) {
                    if (err) throw err;
                    console.log(chalk.greenBright(">> Successfully edited botData.json. Followed values were changed in botData.json:"));
                    console.log(chalk.yellowBright(">> status: ") + chalk.redBright(statusBeforeChanging) + " -> " + chalk.greenBright.bold(status));
                })
            });

        }

    }
};

/**
 * Writing a message to the administrators of a server. (testing)
 *
 * @param message - Message string which will be sent to the administrator.
 * @since 0.0.2-beta
 *
 * @public
 */
exports.sendAdminMessage = function (/**String*/ message) {
  const channel = client.channels.find("name", "dashboard-log");

	channel.send(message);
  console.log(">> Bot Action > Server Admins Message sent to: " + channel.name);
	console.log("> Direct invite link to server: currently not available. on development.")

};

/**
 * Change status from bot to 'dnd' and writes a message to the discord server admins who are using this bot to
 * get informed about the maintenance (maintenance like for testing new functions etc.) [This function is in a Early status!]
 *
 * @param maintenanceBool - Maintenance status of the bot and the app.
 * @param t0 - Number of milliseconds of the process is running. Use for that the function now() (npm module performance-now, added in 0.0.6.1)
 * @since 0.0.4
 *
 * @public
 */
exports.maintenance = function (/**boolean*/ maintenanceBool, /**Number*/t0) {
    if(maintenanceBool === true){
        // localPresence values before the maintenance starts
        let statusBeforeChanging  = client.user.localPresence.status;
        let gameBeforeChanging    = client.user.localPresence.game.name;

        // Set new values to the bot user
        this.setBotStatus("dnd", true);
        this.setGameStatus("Under Maintenance!", true);
        this.sendAdminMessage("Activated Maintenance!");

        app.addLog({
            "log_type" : "info",
            "log_message" : "Server admins got an message which contains information that maintenance was enabled!",
            "log_date" : Date.now(),
            "log_action" : ""
        });

        setTimeout(function(){
            app.addLog({
                "log_type" : "info",
                "log_message" : "Values of bot client changed!",
                "log_date" : Date.now(),
                "log_action" : "Changed values: client.user.localPresence.status , client.user.localPresence.game.name"
            });
        }, 60);

        // Reading the file and replace property values to new ones

        fs.readFile("./botData.json", "utf-8", function (err, data) {
            if (err) throw err;
            let botData = JSON.parse(data);

            // Setting new values for properties.

            botData.maintenance = true;
            botData.bot_game = "Under Maintenance! Do Not Disturb the Developers";
            botData.bot_status = "dnd";

            // Writing new property values into botData.json

            fs.writeFile('./botData.json', JSON.stringify(botData, null, 3), 'utf-8', function(err) {
                if (err) throw err;

                // Output the changes

                console.log(chalk.greenBright(">> Successfully edited botData.json. Followed values were changed in botData.json:"));
                console.log(chalk.yellowBright(">> maintenance: ") + chalk.redBright("false") + " -> " + chalk.greenBright.bold("true"));
                console.log(chalk.yellowBright(">> status: ") + chalk.redBright(statusBeforeChanging) + " -> " + chalk.greenBright.bold("dnd"));
                console.log(chalk.yellowBright(">> bot_game: ") + chalk.redBright(gameBeforeChanging) + " -> " + chalk.greenBright.bold("Monkeys are working!"));
                setTimeout(function() {
                    app.addLog({
                        "log_type": "info",
                        "log_message": "Values in botData.json changed!",
                        "log_date": Date.now(),
                        "log_action": "Changed property values: maintenance, status, bot_game"
                    });
                }, 80)

            })
        });

        // Output the notification

        // I added a timeout cause when I call this function too many times, it cause an error or it doesn´t add all lob entries.
        // Maybe there is an solution but currently I didn´t found one.
        let t1 = now();
        setTimeout(function() {
            app.addLog({
                "log_type": "maintenance",
                "log_message": "Maintenance was enabled!",
                "log_date": Date.now(),
                "log_action": ""
            });
        }, 100);

        console.log("\n>> Bot > Maintenance are now " + chalk.redBright.bold("enabled!"));
        console.log(">> Bot > Notification Message was sent to server admins.");



    }else{
        // localPresence values before the maintenance ends
        let statusBeforeChanging  = client.user.localPresence.status;
        let gameBeforeChanging    = client.user.localPresence.game.name;

        // Set new values to the bot user
        this.setBotStatus("online", true);
        this.setGameStatus("@Xifty", true);
		    this.sendAdminMessage("Deactivated Maintenance!");

        setTimeout(function(){
            app.addLog({
                "log_type" : "info",
                "log_message" : "Values of bot client changed!",
                "log_date" : Date.now(),
                "log_action" : ""
            });
        }, 60);

        // Reading the file and replace property values to new ones
        fs.readFile("./botData.json", "utf-8", function (err, data) {
            if (err) throw err;
            let botData = JSON.parse(data);

            // Setting new values for properties.

            botData.maintenance = false;
            botData.bot_game = "Monkeys are finished!";
            botData.bot_status = "online";

            // Writing new property values into botData.json

            fs.writeFile('./botData.json', JSON.stringify(botData, null, 3), 'utf-8', function(err) {
                if (err) throw err;

                // Output the changes in the files

                console.log(chalk.greenBright(">> Successfully edited botData.json. Followed values were changed in botData.json:"));
                console.log(chalk.yellowBright(">> maintenance: ") + chalk.redBright("true") + " -> " + chalk.greenBright.bold("false"));
                console.log(chalk.yellowBright(">> status: ") + chalk.redBright(statusBeforeChanging) + " -> " + chalk.greenBright.bold("online"));
                console.log(chalk.yellowBright(">> bot_game: ") + chalk.redBright(gameBeforeChanging) + " -> " + chalk.greenBright.bold("Monkeys are finished!"));
                setTimeout(function() {
                    app.addLog({
                        "log_type": "info",
                        "log_message": "Values in botData.json changed!",
                        "log_date": Date.now(),
                        "log_action": ""
                    });
                }, 80);
            })
        });

        // Output the notification

        console.log("\n>> Bot > Maintenance are now " + chalk.greenBright.bold("disabled!"));

        let t1 = now();
        setTimeout(function() {
            app.addLog({
                "log_type": "maintenance",
                "log_message": "Maintenance was disabled!",
                "log_date": Date.now(),
                "log_action": "Disabling maintenance took " + (t1 - t0).toFixed(3) + "ms"
            });
        }, 100)
    }
};
