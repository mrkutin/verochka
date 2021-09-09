const {Markup} = require('telegraf')
const {getDb, search} = require('./database')
const pendingUpdates = require('./pendingUpdates')
const onCallbackQuery = async ctx => {
  const data = JSON.parse(ctx.update?.callback_query?.data)
  const db = getDb(ctx.update.callback_query.message.chat.username)
  if (!db) {
    return
  }

  for (const id in data) {
    try {
      switch (data[id]) {
        case 'show':
          const doc = await db.get(id)
          switch (doc.content_type) {
            case 'image/png':
              await ctx.tg.sendPhoto(ctx.update.callback_query.message.chat.id, doc.file_id)
              break
            default:
              await ctx.reply(doc.text)
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
            switch (doc.content_type) {
              case 'image/png':
                icon = '🏞'
                break
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
