const {Markup} = require('telegraf')
const DB = require('./database')
const pendingUpdates = require('./pendingUpdates')
const onCallbackQuery = async ctx => {
  const data = JSON.parse(ctx.update?.callback_query?.data)
  const db = DB(ctx.update.callback_query.from.username)

  const find = async (id, foundMessage, verbToApply) => {
    const records = await db.search(pendingUpdates(ctx.update.callback_query.from.username).get(id).message.text)

    if (!records.docs.length) {
      ctx.reply('Я ничего не нашла')
      return
    }

    const inlineButtons = records.docs.map(doc => {
      let icon = '📄'
      if(doc.content_type) {
        const [type] = doc.content_type.split('/')
        switch (type) {
          //todo other types
          case 'image':
            icon = '🏞'
            break
          case 'application':
            icon = '🗞'
            break
          case 'multipart':
            icon = '🗄'
            break
        }
      }

      return [{
        text: `${icon} ${doc.text} от ${new Date(doc.createdAt).toLocaleDateString()}`,
        callback_data: JSON.stringify({[doc._id]: verbToApply})
      }]
    })

    ctx.reply(foundMessage,
      Markup
        .inlineKeyboard(inlineButtons)
        .oneTime()
        .resize()
    )
  }

  for (const id in data) {
    try {
      let doc
      switch (data[id]) {
        case 'show':
          doc = await db.get(id)
          if(doc.content_type) {
            if (doc.file_name) {
              // this is a doc
              await ctx.tg.sendDocument(ctx.update.callback_query.from.id, doc.file_id)
            } else {
              //this is a pic
              await ctx.tg.sendPhoto(ctx.update.callback_query.from.id, doc.file_id)
            }
          } else {
            // this is a text
            await ctx.reply(doc.text)
          }
          break
        case 'find':
          await find(id, 'Вот, что я нашла:', 'show')
          break
        case 'save':
          await db.save({
            text: pendingUpdates(ctx.update.callback_query.from.username).get(id).message.text
          })
          ctx.reply('Записала!')
          break
        case 'findToRemove':
          await find(id, 'Что удалить?', 'remove')
          break
        case 'remove':
          doc = await db.get(id)
          await db.remove(doc)
          await ctx.reply('Удалила:')
          ctx.reply(doc.text)
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
