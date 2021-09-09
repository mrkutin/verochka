const https = require('https')
const {getDb} = require('./database')

const onPhoto = async ctx => {
  //todo try
  //todo ask for caption if missing
  const photoURL = await ctx.tg.getFileLink(ctx.update.message.photo[1].file_id)//todo get biggest file

  https.get(photoURL, res => {
    let photo = ''
    res.setEncoding('base64')

    res.on('data', data => photo += data)
    res.on('end', async () => {
      const db = getDb(ctx.update.message.chat.username)
      if (!db) {
        return
      }

      const text = ctx.update.message.caption
      const tags = text?.split(' ') || []

      await db.post({
        _attachments: {
          'photo.png': {
            content_type: 'image/png',
            data: photo
          }
        },
        text,
        tags,
        createdAt: new Date()
      })
    })
  })
}

module.exports = onPhoto
