const Discord = require("discord.js");
const Enmap = require("enmap");
const EnmapLevel = require("enmap-level");
const humanize_duration = require("humanize-duration");

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
                .setTitle("My Commands")
                .addField("help", "Shows this message.")
                .addField("games [page]", "Shows your game playtimes.")
                .addField("ignore", "Prevents your game playtimes from being tracked. " + 
                                     "I will still listen to your commands, so you " +
                                     "can use this one again to enable playtime tracking.")
                .setFooter(`My prefix is @${bot.user.username}`);

            message.channel.send({embed});
        }
    },

    "games": {
        invoke: async (bot, message, page) => {
            author_games = bot.games.get(message.author.id);
            if (!author_games) {
                message.channel.send(`${message.author.username}#${message.author.discriminator} | I don't have any data on your playtimes.`);
                return;
            }

            page = ~~page - 1;
            let pages = await bot.paginate_games_embed(author_games);

            if (pages.length === 0) {
                message.channel.send(`${message.author.username}#${message.author.discriminator} | I don't have any data on your playtimes.`);
            }

            if (page < 0 || page > pages.length - 1) {
                page = 0;
            }

            let embed = pages[page];
            embed.setTitle(`${message.author.username}#${message.author.discriminator} | Your Playtimes`);
            embed.setFooter(`Showing page ${page + 1} of ${pages.length}.`);
            message.channel.send({ embed });
        }
    },

    "ignore": {
        invoke: async (bot, message) => {
            let ignored = bot.ignored.get(message.author.id);
            if (!ignored) {
                bot.ignored.set(message.author.id, true);
                bot.games.delete(message.author.id);
                bot.tracked.delete(message.author.id);
                message.channel.send(`${message.author.username}#${message.author.discriminator} | ` +
                                     "I will no longer track your game playtimes.");
            } else {
                bot.ignored.delete(message.author.id);
                message.channel.send(`${message.author.username}#${message.author.discriminator} | ` +
                                     "I will now track your game playtimes.");
            }
        }
    }
};

class Bot extends Discord.Client {
    constructor() {
        super();

        this.games = new Enmap({ provider: new EnmapLevel({ name: "games" }) });
        this.tracked = new Enmap();
        this.ignored = new Enmap({ provider: new EnmapLevel({ name: "ignored" }) });
        this.on("message", async (message) => {
            await this.handle_message(message);
        });
    }

    get mention() {
        return `<@${this.user.id}>`;
    }

    get prefix() {
        return this.mention;
    }

    async handle_message(message) {
        // Only respond to explicitly invoked commands and non-bots
        if (!message.content.startsWith(this.prefix) || message.author.bot) return;

        const args = message.content.slice(this.prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();

        if (commands[command]) {
            commands[command].invoke(this, message, ...args);
        } else if (command === "") {
            // If the message was just the mention
            commands["help"].invoke(this, message, ...args);
        }
    }

    async paginate_games_embed(games) {
        let pages = [];
        let i = 0;

        function new_embed() {
            let new_em = new Discord.RichEmbed();
            new_em.setColor(config.embed_color);
            return new_em;
        }

        let embed = new_embed();
        for (let name in games) {
            if (i >= 9) {
                i = 0;
                pages.push(embed);
                embed = new_embed();
            }

            embed.addField(name, humanize_duration(games[name], { largest: 3, round: true }), true);
            i++;
        }
        if (!(embed in Object.values(pages))) pages.push(embed);
        return pages;
    }
}

const bot = new Bot();

bot.on("ready", () => {
    console.log("Logged in:");
    console.log("-".repeat(15));
    console.log(`Username: ${bot.user.username}#${bot.user.discriminator}`);
    console.log(`ID: ${bot.user.id}`);
});

bot.on("error", (e) => console.error(e));
bot.on("warn", (e) => console.warn(e));
bot.on("debug", (e) => console.info(e));

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

bot.on("presenceUpdate", async (before, after) => {
    if (after.user.bot) return;

    if (bot.ignored.get(after.user.id)) return;

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
            } else if (after_game !== null) {
                author_games[after_game] = 0;
            }
            current_game["last_update"] = now;

        } else if (before_game === current_game["name"]) {
            if (before_game === after_game) {
                if (author_games.hasOwnProperty(before_game)) {
                    author_games[before_game] += now - current_game["last_update"];
                } else if (before_game !== null) {
                    author_games[before_game] = 0;
                }
                current_game["last_update"] = now;
            } else {
                if (author_games.hasOwnProperty(before_game)) {
                    author_games[before_game] += now - current_game["last_update"];
                } else if (before_game !== null) {
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