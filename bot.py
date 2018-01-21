import json
import asyncio

import discord
from discord.ext import commands

import config

description = """
I am a bot written by Altarrel to keep track of your Discord presence.
"""

class TrackerBot(commands.Bot):
    # Built off of this template: 
    # https://github.com/SourSpoon/Discord.py-Template
    def __init__(self):
        super().__init__(command_prefix=commands.when_mentioned, 
                     description=description)
        self.tracked = {}
        with open("./data.json") as f:
            self.user_games = json.load(f)
        self.loop.create_task(self.load_startup_extensions())

    async def load_startup_extensions(self):
        """Load all extensions
        """

        await self.wait_until_ready()
        # Ensure that on_ready has completed and finished printing
        await asyncio.sleep(1)
        startup_extensions = ("cogs.tracking",
                              "cogs.owner")
        for extension in startup_extensions:
            try:
                self.load_extension(extension)
                print(f"Loaded {extension}")
            except Exception as e:
                error = f"{extension}\n {type(e).__name__} : {e}"
                print(f"Failed to load extension {error}")
            print("-" * 10)

    async def on_ready(self):
        print("LOGGED IN\n"
              f"{'-' * 10}\n"
              f"Username: {self.user}\n"
              f"ID: {self.user.id}\n"
              f"discord.py version: {discord.__version__}")

bot = TrackerBot()
bot.run(config.bot_token)