const DB = require('./database')

const onDocument = async ctx => {
  try {
    if (!ctx.update.message.caption) {
      ctx.reply('Нужно указать название для документа, попробуйте ещё раз')
      return
    }

    await DB(ctx.update.message.from.username).save(
      {
        text: ctx.update.message.caption,
        file_id: ctx.update.message.document.file_id,
        content_type: ctx.update.message.document.mime_type,
        file_name: ctx.update.message.document.file_name
      }
    )

    ctx.reply('Сохранила!')
  } catch (err) {
    console.error(err)
  }
}

module.exports = onDocument
