const {BOT_TOKEN, BOT_DB_USER, BOT_DB_PASSWORD} = process.env

const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-find'))

const {Telegraf, Markup} = require('telegraf')
const bot = new Telegraf(BOT_TOKEN)

const pendingUpdates = {}

const getDb = dbName => {
  return new PouchDB(`http://localhost:5984/${dbName}`, {
    auth: {
      username: BOT_DB_USER,
      password: BOT_DB_PASSWORD
    }
  })
}

bot.on('callback_query', async ctx => {
  const data = JSON.parse(ctx.update?.callback_query?.data)
  for (const id in data) {
    try {
      //todo move under cases
      const update = pendingUpdates[id]
      if (!update.message) {
        continue
      }
      const {message} = update
      const db = getDb(message.chat.username)

      switch (data[id]) {
        case 'show':
          //todo
          break;
        case 'find':
          //todo index
          const res = await db.find({selector: {text: {$regex: message.text}}})

          if (!res.docs.length) {
            ctx.reply('Нет такого')
            //todo запишем?
          }
          const inlineButtons = res.docs.map(doc => {
            return [{
              text: `📄 ${doc.text} от ${new Date(doc.createdAt).toLocaleDateString()}`,
              callback_data: JSON.stringify({[doc._id]: 'show'})
            }]
          })

          ctx.reply('Вот, что я нашла:',
            Markup
              .inlineKeyboard(inlineButtons)
              .oneTime()
              .resize()
          )
          break
        case 'save':
          await db.post({
            text: message.text,
            createdAt: new Date()
          })
          ctx.reply('Записала!')
          break
      }
    } catch (err) {
      console.log(err)
    } finally {
      delete pendingUpdates[id]
    }
  }
})

bot.on('message', async (ctx) => {
  try {
    const {update} = ctx
    const {update_id} = update
    pendingUpdates[update_id] = update
    ctx.reply('Что с этим делать?',
      Markup
        .inlineKeyboard([
          [
            {text: '🔍 Найти', callback_data: JSON.stringify({[update_id]: 'find'})},
            {text: '✏️ Записать', callback_data: JSON.stringify({[update_id]: 'save'})}
          ],
        ])
        .oneTime()
        .resize()
    )
  } catch (err) {
    console.log(err)
  }
})

//todo
bot.on('inline_query', ctx => {
  try {
    console.log()
  } catch (err) {
    console.log()
  }
})

bot.launch()
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
