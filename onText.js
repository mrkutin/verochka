const {Markup} = require('telegraf')
const {pendingUpdates, pendingRename} = require('./maps')
const DB = require('./database')

const onText = async (ctx) => {
  try {
    const {update} = ctx
    const {update_id} = update

    const pendingRenameId = pendingRename(ctx.update.message.from.username).get()
    if (pendingRenameId) {
      const db = DB(ctx.update.message.from.username)
      const doc = await db.get(pendingRenameId)
      doc.text = ctx.update.message.text
      db.save(doc)
      pendingRename(ctx.update.message.from.username).unset()
      ctx.reply('Записала!')
      return
    }

    pendingUpdates(ctx.update.message.from.username).set(update_id, update)
    ctx.reply('Что с этим делать?',
      Markup
        .inlineKeyboard([
          [
            {text: '✏️ Записать', callback_data: JSON.stringify({[update_id]: 'save'})},
            {text: '🗑 Удалить', callback_data: JSON.stringify({[update_id]: 'findToRemove'})}
          ],
          [
            {text: '🔍 Найти', callback_data: JSON.stringify({[update_id]: 'find'})},
          ]
        ])
        .oneTime()
        .resize()
    )
  } catch (err) {
    console.error(err)
  }
}

module.exports = onText
