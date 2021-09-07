const {BOT_TOKEN, BOT_DB_USER, BOT_DB_PASSWORD} = process.env

const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-find'))

const {Telegraf, Markup} = require('telegraf')
const bot = new Telegraf(BOT_TOKEN)

const pendingUpdates = {}

const getDb = dbName => {
  if (!dbName) {
    return null
  }

  const db = new PouchDB(`http://localhost:5984/${dbName}`, {
    auth: {
      username: BOT_DB_USER,
      password: BOT_DB_PASSWORD
    }
  })

  db.createIndex({
    index: {
      fields: ['text']
    }
  })

  db.createIndex({
    index: {
      fields: ['tags']
    }
  })

  db.createIndex({
    index: {
      fields: ['createdAt']
    }
  })

  return db
}

const search = (db, text) => {
  const tags = text.split(' ')
  return db.find(
      {
        selector: {
          $or: [
            {tags: {$all: tags}},
            {text: {$regex: text}}
          ]
        },
        sort: [{createdAt: 'desc'}],
        limit: 5
      }
  )
}

bot.on('callback_query', async ctx => {
  const data = JSON.parse(ctx.update?.callback_query?.data)
  for (const id in data) {
    try {
      const db = getDb(ctx.update.callback_query.message.chat.username)
      if (!db) {
        continue
      }

      let tags
      let text

      switch (data[id]) {
        case 'show':
          const doc = await db.get(id)
          ctx.reply(doc.text)
          break
        case 'find':
          const records = await search(db, pendingUpdates[id])

          if (!records.docs.length) {
            ctx.reply('Я ничего не нашла')
            return
          }

          const inlineButtons = records.docs.map(doc => {
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
        case
        'save'
        :
          text = pendingUpdates[id]
          tags = text.split(' ')
          await db.post({
            text,
            tags,
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

bot.on('inline_query', async ctx => {
  try {
    const db = getDb(ctx.update.inline_query.from.username)
    if (!db) {
      return
    }

    const records = await search(db, ctx.update.inline_query.query)

    if (!records.docs.length) {
      return
    }

    const results = records.docs.map((record, idx) => {
      return {
        id: idx,
        type: 'article',
        title: record.text,
        input_message_content: {
          message_text: record.text
        }
      }
    })

    ctx.answerInlineQuery(results)
  } catch (err) {
    console.log(err)
  }
})

bot.launch()
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
