const {input} = require('@cycle/dom')

const view = ({value, change}) =>
  input({
    props: {
      value
    },
    on: {
      change
    }
  })

module.exports = {view}