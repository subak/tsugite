const {propEq,pipe,juxt,flatten,apply,remove} = require('ramda');
const {merge} = require('rxjs');
const {tap,filter,map} = require('rxjs/operators');
const {paths} = require('tsugite/ramda')

const create = (ns, state, view) => {
  const NS = ns.join('.')

  const hooks = ({events$}) => ({
    vnode$: events$.pipe(
      filter(propEq(0, `${NS}.vnode`)),
      map(remove(0,1))),
    change$: events$.pipe(
      filter(propEq(0, `${NS}.change`)),
      map(remove(0,1)))
  })

  const vnode = ([events$, value$]) =>
    value$.pipe(
      map(([value, ...args]) =>
        [
          value ? view({value}) : '',
          ...args
        ]),
      map(([vnode, ...args]) =>
        [`${NS}.vnode`, vnode, ...args]))

  const events = pipe(juxt([
    pipe(paths([['events$'], [...state, 'value$']]), vnode),
  ]), flatten, apply(merge))

  return {hooks, events}
}

module.exports = {create}