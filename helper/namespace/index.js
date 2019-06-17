const {assocPath,mergeDeepRight} = require('ramda')

const walk = (value, ns=[]) => {
  if (value) {
    return [
      assocPath(ns, {ns}, {}),
      ...Object.entries(value)
        .map(([key, value]) =>
          walk(value, ns.concat(key)))
    ]
  } else {
    return assocPath(ns, {ns}, {})
  }
}

const makeNs = (moduleName, nameMap) => ({
  ns: [moduleName],
  ...walk(nameMap, [moduleName])
    .flat(Infinity)
    .reduce(mergeDeepRight, {})[moduleName]
})

module.exports = {makeNs,walk}