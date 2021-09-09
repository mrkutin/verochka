const {Markup} = require('telegraf')
const {getDb, search} = require('./database')
const pendingUpdates = require('./pendingUpdates')
const onCallbackQuery = async ctx => {
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
}

module.exports = onCallbackQuery
