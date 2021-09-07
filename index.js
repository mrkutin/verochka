const {BOT_TOKEN, BOT_DB_USER, BOT_DB_PASSWORD} = process.env

const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-find'))

const {Telegraf, Markup} = require('telegraf')
const bot = new Telegraf(BOT_TOKEN)

const pendingUpdates = {}

const getDb = async dbName => {
  if (!dbName) {
    return null
  }

  const db = new PouchDB(`http://localhost:5984/${dbName}`, {
    auth: {
      username: BOT_DB_USER,
      password: BOT_DB_PASSWORD
    }
  })

  await db.createIndex({
    index: {
      fields: ['text']
    }
  })

  return db
}

bot.on('callback_query', async ctx => {
  const data = JSON.parse(ctx.update?.callback_query?.data)
  for (const id in data) {
    try {
      const db = await getDb(ctx.update.callback_query.message.chat.username)
      if (!db) {
        continue
      }

      switch (data[id]) {
        case 'show':
          const doc = await db.get(id)
          ctx.reply(doc.text)
          break
        case 'find':
          const res = await db.find({selector: {text: {$regex: pendingUpdates[id]}}})

          if (!res.docs.length) {
            ctx.reply('Ничего не нашла')
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
            text: pendingUpdates[id],
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
    pendingUpdates[update_id] = update.message.text
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
