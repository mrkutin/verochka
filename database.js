const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-find'))

const {BOT_DB_USER, BOT_DB_PASSWORD} = process.env

const getDb = dbName => {
    if (!dbName) {
        return null
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

    return db
}

const search = (db, text) => {
    const tags = text.split(' ')
    return db.find(
        {
            selector: {
                $or: [
                    {tags: {$all: tags}},
                    {text: {$regex: text}}
                ]
            },
            sort: [{createdAt: 'desc'}],
            limit: 5
        }
    )
}

module.exports = {
    getDb,
    search
}
