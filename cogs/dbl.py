import aiohttp

import config

def setup(bot):
    bot.add_cog(DiscordBotList(bot))

class DiscordBotList:
    """Update stats on https://discordbots.org/
    """

    def __init__(self, bot):
        self.bot = bot

    async def update(self):
        url = f"https://discordbots.org/api/bots/{self.bot.user.id}/stats"
        headers = {"Authorization": config.dbl_token}
        payload = {"server_count": len(self.bot.guilds)}
        async with aiothttp.ClientSession() as session:
            await session.post(url, data=payload, headers=headers)

    async def on_ready(self):
        await self.update()

    async def on_guild_join(self):
        await self.update()

    async def on_guild_remove(self):
        await self.update()
