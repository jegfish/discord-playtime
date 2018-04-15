const Discord = require("discord.js");
const Enmap = require("enmap");
const EnmapLevel = require("enmap-level");
const humanize_duration = require("humanize-duration");
const table = require("text-table");
let DBL, dbl;

const config = require("./config.json");
const commands = require("./commands.js");

if (config.post_stats) {
    DBL = require("dblapi.js");
    dbl = new DBL(config.dbl_token);
}

class Bot extends Discord.Client {
    constructor() {
        super();

        this.games = new Enmap({ provider: new EnmapLevel({ name: "games" }) });
        this.tracked = new Enmap();
        this.ignored = new Enmap({ provider: new EnmapLevel({ name: "ignored" }) });
        this.on("message", async (message) => await this.handle_message(message));
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

        if (command in commands) {
            commands[command](this, message, ...args).then().catch(console.error);
        } else if (command === "") {
            // If the message was just the mention, show help command
            commands["help"](this, message, ...args).then().catch(console.error);
        }
    }

    async tabulate_games(games) {
        let pages = [];
        games = Array.from(Object.entries(games));
        games = await this.sort_games(games);
        while (games.length > 0) {
            let page_data = games.slice(0, 11);
            let arr = [
                ["Game", "Playtime"],
                ["----", "--------"]
            ];
            for (let i of page_data) {
                i[1] = humanize_duration(i[1], { largest: 2, round: true });
            }
            arr = arr.concat(page_data);
            let page_table = table(arr);
            let page_text = "```\n" + page_table
            pages.push(page_text);
            games = games.slice(11);
        }
        return pages;
    }

    async sort_games(games) {
        function comparePlaytimes(a, b) {
            return b[1] - a[1];
        }
        return games.sort(comparePlaytimes);
    }

    async user_convert(text) {
        if (!text) {
            return null;
        }
        let result = null;
        const mention = text.match(/<@!?(\d+)>/);
        if (mention !== null) {
            // If text is a mention, fetch the user by their ID from mention
            result = await this.fetchUser(mention[1]);
        } else if (!isNaN(parseInt(text))) {
            // If it's an int, possibly an ID
            result = await this.fetchUser(text);
        } else {
            // Try searching by name#discrim
            if (text.length > 5 && text.slice(-5, -4) === "#") {
                const discrim = text.slice(-4);
                const name = text.slice(0, -5);
                result = this.users.find(user => user.username === name && user.discriminator === discrim);
            }
        }

        return result;
    }
}

const bot = new Bot();

bot.on("ready", async () => {
    console.log("Logged in:");
    console.log("-".repeat(15));
    console.log(`Username: ${bot.user.username}#${bot.user.discriminator}`);
    console.log(`ID: ${bot.user.id}`);

    await bot.user.setPresence({ game: {name: `Prefix: @${bot.user.username}`} });

    if (config.post_stats) {
        bot.setInterval(() => {
            dbl.postStats(bot.guilds.size);
            console.log("Uploaded guild count to discord bot list.");
        }, 600000);
    }
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

bot.login(config.bot_token);
