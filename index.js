const {BOT_TOKEN} = process.env
const {Telegraf} = require('telegraf')

const onText = require('./onText')
const onPhoto = require('./onPhoto')
const onAudio = require('./onAudio')
const onVoice = require('./onVoice')
const onVideo = require('./onVideo')
const onVideoNote = require('./onVideoNote')
const onDocument = require('./onDocument')
const onCallbackQuery = require('./onCallbackQuery')
const onInlineQuery = require('./onInlineQuery')

const bot = new Telegraf(BOT_TOKEN)

// bot.on('message', ctx => {
//   console.log()
// })

bot.on('text', onText)
bot.on('photo', onPhoto)
bot.on('audio', onAudio)
bot.on('voice', onVoice)
bot.on('video', onVideo)
bot.on('video_note', onVideoNote)
bot.on('document', onDocument)
bot.on('callback_query', onCallbackQuery)
bot.on('inline_query', onInlineQuery)

bot.launch()
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
