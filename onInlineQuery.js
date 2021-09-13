// todo nor implemented properly: photo ignores caption etc
const DB = require("./database")
const onInlineQuery = async ctx => {
  try {
    const records = await DB(ctx.update.inline_query.from.username).search(ctx.update.inline_query.query)

    if (!records.docs.length) {
      return
    }

    const results = records.docs.map((doc, idx) => {
      switch (doc.type) {
        case 'photo':
          return {
            id: idx,
            type: 'photo',
            photo_file_id: doc.file_id,
            title: doc.text,
            input_message_content: {
              message_text: doc.text
            }
          }
        case 'video':
          return {
            id: idx,
            type: 'video',
            video_file_id: doc.file_id,
            title: doc.text
          }
        case 'video_note':
          return {
            id: idx,
            type: 'video_note',
            video_note_file_id: doc.file_id,
            title: doc.text
          }
        case 'audio':
          return {
            id: idx,
            type: 'audio',
            audio_file_id: doc.file_id,
            caption: doc.text
          }
        case 'voice':
          return {
            id: idx,
            type: 'voice',
            voice_file_id: doc.file_id,
            title: doc.text
          }
        case 'document':
          return {
            id: idx,
            type: 'document',
            document_file_id: doc.file_id,
            title: doc.text
          }
      }

      return {
        id: idx,
        type: 'article',
        title: doc.text,
        input_message_content: {
          message_text: doc.text
        }
      }
    })

    ctx.answerInlineQuery(results, {})
  } catch (err) {
    console.error(err)
  }
}

module.exports = onInlineQuery
