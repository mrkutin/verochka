const {BOT_TOKEN, BOT_DB_USER, BOT_DB_PASSWORD} = process.env
const PouchDB = require('pouchdb')
const { Telegraf, Markup } = require('telegraf')
const bot = new Telegraf(BOT_TOKEN)

const getDb = dbName => {
    return new PouchDB(`http://localhost:5984/${dbName}`, {
        auth: {
            username: BOT_DB_USER,
            password: BOT_DB_PASSWORD
        }
    })
}

bot.hears('🔍 Найти', ctx => ctx.reply('Нашла!'))
bot.hears('✏️ Записать', ctx => ctx.reply('Записала!'))

bot.on('callback_query', ctx => {
    console.log()
})

bot.on('message', async (ctx) => {
    const {update: {message, update_id}} = ctx


    ctx.reply('Что с этим делать?',
        Markup
        .inlineKeyboard([
            [{text: '🔍 Найти', callback_data: JSON.stringify({find: update_id})}, {text: '✏️ Записать', callback_data: JSON.stringify({save: update_id})}],
        ])
        .oneTime()
        .resize()
    )
    // try {
    //     const db = getDb(message.chat.username)
    //     await db.post({ text: message.text })
    //     tg.sendMessage(message.chat.id, 'Записала!')
    // } catch (e) {
    //     console.error(e)
    // }
})



bot.launch()
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))