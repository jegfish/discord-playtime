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
        super().init(command_prefix=commands.when_mentioned(), 
                     description=description)

    async def load_startup_extensions(self):
        """Attempts to load all .py files in /cogs/ as cog extensions
        """

        await self.wait_until_ready()
        # Ensure that on_ready has completed and finished printing
        await asyncio.sleep(1)
        cogs = [x.stem for x in Path("cogs").glob("*.py")]
        for extension in cogs:
            try:
                self.load_extension(f"cogs.{extension}")
                print(f"Loaded {extension}")
            except Exception as e:
                error = f"{extension}\n {type(e).__name__} : {e}"
                print(f"Failed to load extension {error}")
            print("-" * 10)

    async def on_ready(self):
        print("LOGGED IN"
              "-" * 10
              f"Username: {self.user}"
              f"ID: {self.user.id}"
              f"discord.py version: {discord.__version__}")

bot = TrackerBot()
bot.run(config.token)