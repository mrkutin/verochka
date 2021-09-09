const data = {}

const pendingUpdates = username => {
  if (!data[username]) {
    data[username] = {}
  }

  return {
    set: (key, value) => {
      data[username][key] = value
      return data[username][key]
    },
    get: (key) => {
      return data[username][key]
    },
    unset: (key) => {
      delete data[username][key]
    }
  }
}

module.exports = pendingUpdates
