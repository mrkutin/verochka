const DB = require('./database')
const {pendingRename} = require("./maps");

const onPhoto = async ctx => {
  try {
    const largestPhoto = ctx.update.message.photo.reduce((acc, photo) => {
      if (photo.file_size > acc.file_size) {
        return photo
      }
      return acc
    }, {file_size: 0})

    const doc = await DB(ctx.update.message.from.username).save(
      {
        text: ctx.update.message.caption,
        content_type: 'image/png',
        file_id: largestPhoto.file_id,
        type: 'photo'
      }
    )

    if (!ctx.update.message.caption) {
      ctx.reply('Придумайте название для этого фото, чтобы его потом можно было найти')
      pendingRename(ctx.update.message.from.username).set(doc.id)
      return
    }

    ctx.reply('Сохранила!')
  } catch (err) {
    console.error(err)
  }
}

module.exports = onPhoto
