const {getDb, search} = require("./database");
const onInlineQuery = async ctx => {
  try {
    const db = getDb(ctx.update.inline_query.from.username)
    if (!db) {
      return
    }

    const records = await search(db, ctx.update.inline_query.query)

    if (!records.docs.length) {
      return
    }

    const results = records.docs.map((record, idx) => {
      //todo images
      return {
        id: idx,
        type: 'article',
        title: record.text,
        input_message_content: {
          message_text: record.text
        }
      }
    })

    ctx.answerInlineQuery(results)
  } catch (err) {
    console.error(err)
  }
}

module.exports = onInlineQuery
