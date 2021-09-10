const DB = require('./database')
const {pendingRename} = require("./maps");

const onVideoNote = async ctx => {
  try {
    const doc = await DB(ctx.update.message.from.username).save(
      {
        text: ctx.update.message.caption,
        content_type: 'video_note/mp4',
        file_id: ctx.update.message.video_note.file_id
      }
    )

    if (!ctx.update.message.caption) {
      ctx.reply('Придумайте название для этого видео, чтобы его потом можно было найти')
      pendingRename(ctx.update.message.from.username).set(doc.id)
      return
    }

    ctx.reply('Сохранила!')
  } catch (err) {
    console.error(err)
  }
}

module.exports = onVideoNote
