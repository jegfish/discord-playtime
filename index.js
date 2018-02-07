const Discord = require("discord.js");
const Enmap = require("enmap");
const EnmapLevel = require("enmap-level");
const moment = require("moment");

const config = require("./config.json");

const commands = {
    "ping": {
        invoke: async (bot, message) => {
            message.channel.send(`Pong! ${bot.ping}ms`);
        }
    },

    "help": {
        invoke: async (bot, message) => {
            const embed = new Discord.RichEmbed()
                .setColor(config.embed_color)
                .addField("help", "Shows this message.");

            message.channel.send({embed});
        }
    },

    "games": {
        invoke: async (bot, message) => {
            author_games = bot.games.get(message.author.id);
            if (!author_games) {
                message.channel.send("I don't have any games data on you.");
                return;
            }

            const embed = new Discord.RichEmbed()
                .setColor(config.embed_color)
                .addField(Object.keys(author_games)[0], moment.duration(Object.values(author_games)[0], "milliseconds").humanize());

            message.channel.send({ embed });
        }
    }
};

class Bot extends Discord.Client {
    constructor() {
        super();

        this.games = new Enmap({ provider: new EnmapLevel({ name: "games" }) });
        this.tracked = new Enmap();
        this.on("message", (message) => {
            this.process_commands(message).then().catch(console.err);
        });
    }

    get mention() {
        return `<@${this.user.id}>`;
    }

    get prefix() {
        return this.mention;
    }

    async process_commands(message) {
        // Only respond to explicitly invoked commands
        if (!message.content.startsWith(this.prefix)) return;

        const args = message.content.slice(this.prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();

        if (commands[command]) {
            commands[command].invoke(this, message, ...args);
        } else if (command === "") {
            // If the message was just the mention
            commands["help"].invoke(this, message, ...args);
        }
    }
}

const bot = new Bot();

bot.on("ready", () => {
    console.log("Logged in:");
    console.log("-".repeat(15));
    console.log(`Username: ${bot.user.username}#${bot.user.discriminator}`);
    console.log(`ID: ${bot.user.id}`);
});

/*
Basic setup of the user's data:

{
userID: {
    unique_game_name: playtime,

    current_game: {
        start: Date,
        recent: Date    
    }
}
}
*/

bot.on("presenceUpdate", (before, after) => {
    console.log(`presenceUpdate detected from ${after.user.username}#${after.user.discriminator}`);
    if (after.bot) return;

    // Handle if they aren't playing a game
    let before_game;
    if (before.presence.game) {
        before_game = before.presence.game.name;

    } else {
        before_game = null;
    }
    let after_game;
    if (after.presence.game) {
        after_game = after.presence.game.name;

    } else {
        after_game = null;
    }

    let author_games = bot.games.get(after.id);
    let current_game = bot.tracked.get(after.id);
    const now = Date.now();
    if (author_games === undefined) {
        author_games = {};
        if (before_game !== null) {
            author_games[before_game] = 0;
        }
        if (after_game !== null) {
            author_games[after_game] = 0;
        }

    }
    if (current_game === undefined) {
        if (after_game !== null) {
            current_game = {
                "name": after_game,
                "last_update": now
            }
        }

    } else {
        if (after_game === current_game["name"]) {
            current_game["recent"] = now;
            if (author_games.hasOwnProperty(after_game)) {
                author_games[after_game] += now - current_game["last_update"];

            } else {
                author_games[after_game] = 0;
            }

        } else if (before_game === current_game["name"]) {
            if (before_game === after_game) {
                if (author_games.hasOwnProperty(before_game)) {
                    author_games[before_game] += now - current_game["last_update"];

                } else {
                    author_games[before_game] = 0;
                }
            } else {
                current_game["recent"] = now;
                if (author_games.hasOwnProperty(before_game)) {
                    author_games[before_game] += now - current_game["last_update"];
                } else {
                    author_games[before_game] = 0;
                }
                // Change current_game
                current_game = {
                    "name": after_game,
                    "last_update": now
                }
            }
        }
        /*
        Shouldn't need an else. current_game isn't persistent, and is always tracked
        so either before_game or after_game will be current_game.
        */
    }

    bot.games.set(after.id, author_games);
    bot.tracked.set(after.id, current_game);
});

bot.login(config.token);