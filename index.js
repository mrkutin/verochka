const {BOT_TOKEN, BOT_DB_USER, BOT_DB_PASSWORD} = process.env
const PouchDB = require('pouchdb')
const { Telegraf } = require('telegraf')
const bot = new Telegraf(BOT_TOKEN)

bot.on('message', async ({tg, update: {message}}) => {
    try {
        const db = new PouchDB(`http://localhost:5984/${message.chat.username}`, {
            auth: {
                username: BOT_DB_USER,
                password: BOT_DB_PASSWORD
            }
        })
        await db.post({ text: message.text })
        tg.sendMessage(message.chat.id, 'Записала!')
    } catch (e) {
        console.error(e)
    }
})

bot.launch()
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))