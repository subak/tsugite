const {sep} = require('path');
const {findIndex, equals} = require('ramda');

const nsFromPath = (moduleName, path) => {
  const paths = path.split(sep)
  const idx = findIndex(equals(moduleName), paths)
  return paths.slice(idx, -1)
}

module.exports = {nsFromPath}