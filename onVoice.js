const DB = require('./database')
const {pendingRename} = require("./maps");

const onVoice = async ctx => {
  try {
    const doc = await DB(ctx.update.message.from.username).save(
      {
        text: ctx.update.message.caption,
        content_type: 'voice/mpeg3',
        file_id: ctx.update.message.voice.file_id,
        type: 'voice'
      }
    )

    if (!ctx.update.message.caption) {
      ctx.reply('Придумайте название для этого аудио, чтобы его потом можно было найти')
      pendingRename(ctx.update.message.from.username).set(doc.id)
      return
    }

    ctx.reply('Сохранила!')
  } catch (err) {
    console.error(err)
  }
}

module.exports = onVoice
