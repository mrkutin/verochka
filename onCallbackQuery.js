const {Markup} = require('telegraf')
const DB = require('./database')
const pendingUpdates = require('./pendingUpdates')
const onCallbackQuery = async ctx => {
  const data = JSON.parse(ctx.update?.callback_query?.data)
  const db = DB(ctx.update.callback_query.from.username)

  for (const id in data) {
    try {
      switch (data[id]) {
        case 'show':
          const doc = await db.get(id)
          switch (doc.content_type) {
            case 'image/png':
              await ctx.tg.sendPhoto(ctx.update.callback_query.from.id, doc.file_id)
              break
            default:
              await ctx.reply(doc.text)
          }
          break
        case 'find':
          const records = await db.search(pendingUpdates(ctx.update.callback_query.from.username).get(id).message.text)

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
          await db.save({
            text: pendingUpdates(ctx.update.callback_query.from.username).get(id).message.text
          })
          ctx.reply('Записала!')
          break
      }
    } catch (err) {
      console.error(err)
    } finally {
      delete pendingUpdates(ctx.update.callback_query.from.username).unset(id)
    }
  }
}

module.exports = onCallbackQuery
