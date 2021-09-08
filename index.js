const {BOT_TOKEN} = process.env

const {Telegraf, Markup} = require('telegraf')
const bot = new Telegraf(BOT_TOKEN)

const https = require('https')
const fs = require('fs')

const pendingUpdates = {}

const {getDb, search} = require('./database')

bot.on('text', async (ctx) => {
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
    console.error(err)
  }
})

bot.on('photo', async ctx => {
  //todo try
  const db = getDb(ctx.update.message.chat.username)

  if (!db) {
    return
  }

  await db.post({
    _attachments: {
      'myattachment.txt': {
        content_type: 'text/plain',
        data: 'aGVsbG8gd29ybGQ='
      }
    },
    // text,
    // tags,
    createdAt: new Date()
  })


  //todo ask for caption if missing
  const photo = await ctx.tg.getFileLink(ctx.update.message.photo[1].file_id)//todo get biggest file

  const file = fs.createWriteStream('./photo.txt')
  https.get(photo, res => {
    res.setEncoding('base64');
    // res.pipe(file)
  })
  // ctx.update.message.caption
  // ctx.update.message.photo
  console.log()
})

bot.on('callback_query', async ctx => {
  const data = JSON.parse(ctx.update?.callback_query?.data)
  for (const id in data) {
    try {
      const db = getDb(ctx.update.callback_query.message.chat.username)
      if (!db) {
        continue
      }

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
        'save':
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
      console.error(err)
    } finally {
      delete pendingUpdates[id]
    }
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
    console.error(err)
  }
})

bot.launch()
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
