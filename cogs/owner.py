class Owner:
    """Bot owner commands
    """

    def __init__(self, bot):
        self.bot = bot

    async def __local_check(self, ctx):
        return await self.bot.is_owner(ctx.author)

    @commands.command()
    async def die(self, ctx):
        await ctx.send("Logging out...")
        await self.bot.logout()