const {BOT_TOKEN} = process.env

const {Telegraf, Markup} = require('telegraf')
const bot = new Telegraf(BOT_TOKEN)

const https = require('https')

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
  //todo ask for caption if missing
  const photoURL = await ctx.tg.getFileLink(ctx.update.message.photo[1].file_id)//todo get biggest file

  https.get(photoURL, res => {
    let photo = ''
    res.setEncoding('base64')

    res.on('data', data => photo += data)
    res.on('end', async () => {
      const db = getDb(ctx.update.message.chat.username)
      if (!db) {
        return
      }

      const text = ctx.update.message.caption
      const tags = text?.split(' ') || []

      await db.post({
        _attachments: {
          'photo.png': {
            content_type: 'image/png',
            data: photo
          }
        },
        text,
        tags,
        createdAt: new Date()
      })
    })
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
          const doc = await db.get(id, {attachments: true})
          if (doc._attachments) {
            const fileName = Object.keys(doc._attachments)[0]
            const attachment = doc._attachments[fileName]
            //todo
            ctx.tg.sendPhoto(ctx.update.callback_query.message.chat.id, 'AgACAgIAAxkBAAIB7WE5xUwUifzgJu9qHIR2JGXK_VAkAALsuDEbDcXJSetNSIz3C0xGAQADAgADbQADIAQ')
          } else {
            ctx.reply(doc.text)
          }
          break
        case 'find':
          const records = await search(db, pendingUpdates[id])

          if (!records.docs.length) {
            ctx.reply('Я ничего не нашла')
            return
          }

          const inlineButtons = records.docs.map(doc => {
            let icon = '📄'
            if (doc._attachments) {
              const attachment = doc._attachments[Object.keys(doc._attachments)[0]]
              switch (attachment.content_type) {
                case 'image/png':
                  icon = '🏞'
                    break
              }
            }

            return [{
              text: `${icon} ${doc.text} от ${new Date(doc.createdAt).toLocaleDateString()}`,
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
          const text = pendingUpdates[id]
          const tags = text?.split(' ') || []
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
      //todo images
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
