const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-find'))

const {BOT_DB_USER, BOT_DB_PASSWORD} = process.env

const DB = dbName => {
    if (!dbName) {
        return Promise.reject(new Error('Can\'t get a DB'))
    }

    const db = new PouchDB(`http://localhost:5984/${dbName}`, {
        auth: {
            username: BOT_DB_USER,
            password: BOT_DB_PASSWORD
        }
    })

    db.createIndex({
        index: {
            fields: ['text']
        }
    })

    db.createIndex({
        index: {
            fields: ['tags']
        }
    })

    db.createIndex({
        index: {
            fields: ['createdAt']
        }
    })

    const getTags = text => {
        return text?.toLowerCase().split(' ') || []
    }

    return {
        get: (id) => {
            return db.get(id)
        },

        save: (doc) => {
            if (!doc.tags) {
                doc.tags = getTags(doc.text)
            }
            if (!doc.createdAt) {
                doc.createdAt = new Date()
            }
            return db.post(doc)
        },

        search: (text) => {
            const tags = getTags(text)
            return db.find(
              {
                  selector: {
                      $or: [
                          {tags: {$all: tags}},
                          {text: {$regex: text}}
                      ]
                  },
                  sort: [{createdAt: 'desc'}],
                  limit: 10
              }
            )
        }
    }
}

module.exports = DB
