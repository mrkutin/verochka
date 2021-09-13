const {Markup} = require('telegraf')
const DB = require('./database')
const {pendingUpdates} = require('./maps')
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
      switch (doc.type) {
        case 'image':
          icon = '📷'
          break
        case 'audio':
        case 'voice':
          icon = '🎙'
          break
        case 'video':
        case 'video_note':
          icon = '📹'
          break
        case 'application':
          icon = '🗞'
          break
        case 'multipart':
          icon = '🗄'
          break
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
          switch(doc.type) {
            case 'text':
              await ctx.reply(doc.text)
              break
            case 'document':
              await ctx.tg.sendDocument(ctx.update.callback_query.from.id, doc.file_id)
              break
            case 'image':
              await ctx.tg.sendPhoto(ctx.update.callback_query.from.id, doc.file_id)
              break
            case 'audio':
              await ctx.tg.sendAudio(ctx.update.callback_query.from.id, doc.file_id)
              break
            case 'voice':
              await ctx.tg.sendVoice(ctx.update.callback_query.from.id, doc.file_id)
              break
            case 'video':
              await ctx.tg.sendVideo(ctx.update.callback_query.from.id, doc.file_id)
              break
            case 'video_note':
              await ctx.tg.sendVideoNote(ctx.update.callback_query.from.id, doc.file_id)
              break
          }
          break
        case 'find':
          await find(id, 'Вот, что я нашла:', 'show')
          break
        case 'save':
          await db.save({
            text: pendingUpdates(ctx.update.callback_query.from.username).get(id).message.text,
            type: 'text'
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
