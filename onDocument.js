const DB = require('./database')
const {pendingRename} = require('./maps')

const onDocument = async ctx => {
  try {
    const doc = await DB(ctx.update.message.from.username).save(
      {
        text: ctx.update.message.caption,
        file_id: ctx.update.message.document.file_id,
        content_type: ctx.update.message.document.mime_type,
        file_name: ctx.update.message.document.file_name
      }
    )

    if (!ctx.update.message.caption) {
      ctx.reply('Придумайте название для этого документа, чтобы его потом можно было найти')
      pendingRename(ctx.update.message.from.username).set(doc.id)
      return
    }

    ctx.reply('Сохранила!')
  } catch (err) {
    console.error(err)
  }
}

module.exports = onDocument
