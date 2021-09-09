const {getDb} = require('./database')

const onPhoto = async ctx => {
  const db = getDb(ctx.update.message.from.username)
  if (!db) {
    return
  }

  //todo try
  //todo ask for caption if missing
  const largestPhoto = ctx.update.message.photo.reduce((acc, photo) => {
    if(photo.file_size > acc.file_size){
      return photo
    }
    return acc
  }, {file_size: 0})

  const text = ctx.update.message.caption
  const tags = text?.split(' ') || []

  await db.post({
    text,
    tags,
    content_type: 'image/png',
    file_id: largestPhoto.file_id,
    createdAt: new Date()
  })
}

module.exports = onPhoto
