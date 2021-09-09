const {BOT_TOKEN} = process.env
const {Telegraf} = require('telegraf')

const onText = require('./onText')
const onPhoto = require('./onPhoto')
const onCallbackQuery = require('./onCallbackQuery')
const onInlineQuery = require('./onInlineQuery')

const bot = new Telegraf(BOT_TOKEN)

bot.on('text', onText)
bot.on('photo', onPhoto)
bot.on('callback_query', onCallbackQuery)
bot.on('inline_query', onInlineQuery)

bot.launch()
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
