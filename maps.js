const pendingUpdatesData = {}
const pendingRenameData = {}

const pendingRename = username => {
  return {
    set: (value) => {
      pendingRenameData[username] = value
      return pendingUpdatesData[username]
    },
    get: () => {
      return pendingRenameData[username]
    },
    unset: () => {
      pendingRenameData[username] = null
    }
  }
}

const pendingUpdates = username => {
  if (!pendingUpdatesData[username]) {
    pendingUpdatesData[username] = {}
  }

  return {
    set: (key, value) => {
      pendingUpdatesData[username][key] = value
      return pendingUpdatesData[username][key]
    },
    get: (key) => {
      return pendingUpdatesData[username][key]
    },
    unset: (key) => {
      delete pendingUpdatesData[username][key]
    }
  }
}



module.exports = {
  pendingUpdates,
  pendingRename
}
