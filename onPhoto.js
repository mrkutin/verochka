const DB = require('./database')

const onPhoto = async ctx => {
  try {
    if (!ctx.update.message.caption) {
      ctx.reply('Нужно указать название для картинки, попробуйте ещё раз')
      return
    }

    const largestPhoto = ctx.update.message.photo.reduce((acc, photo) => {
      if (photo.file_size > acc.file_size) {
        return photo
      }
      return acc
    }, {file_size: 0})

    await DB(ctx.update.message.from.username).save(
      {
        text: ctx.update.message.caption,
        content_type: 'image/png',
        file_id: largestPhoto.file_id
      }
    )

    ctx.reply('Сохранила!')
  } catch (err) {
    console.error(err)
  }
}

module.exports = onPhoto
