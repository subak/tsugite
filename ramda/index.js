const {pipe,juxt,path,map} = require('ramda')

const paths = indexes =>
  juxt(map(idx => path(idx), indexes))

const newInstance = constructor =>
  (...args) =>
    new constructor(...args)

module.exports = {paths, newInstance}