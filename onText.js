const {Markup} = require('telegraf')
const pendingUpdates = require('./pendingUpdates')

const onText = async (ctx) => {
  try {
    const {update} = ctx
    const {update_id} = update
    pendingUpdates(ctx.update.message.from.username).set(update_id, update)
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
}

module.exports = onText
