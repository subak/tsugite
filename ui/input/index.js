const {propEq,pipe,juxt,flatten,apply,remove} = require('ramda');
const {merge} = require('rxjs');
const {tap,filter,map} = require('rxjs/operators');
const {paths} = require('tsugite/ramda')
const {sink} = require('tsugite/helper/events')

const {view:defaultView} = require('./view')

const create = (ns, state, view=defaultView) => {
  const NS = ns.join('.')

  const hooks = ({events$}) => ({
    vnode$: events$.pipe(
      filter(propEq(0, `${NS}.vnode`)),
      map(remove(0,1))),
    change$: events$.pipe(
      filter(propEq(0, `${NS}.change`)),
      map(remove(0,1)))
  })

  const vnode = ([next, value$]) =>
    value$.pipe(
      map(([value, ...args]) =>
        [
          view({
            value,
            change: ev =>
              next([`${NS}.change`, ev, ...args])}),
          ...args
        ]),
      map(([vnode, ...args]) =>
        [`${NS}.vnode`, vnode, ...args]))

  const change = ([change$, update]) =>
    change$.pipe(
      map(([{target:{value}}, ...args]) =>
        update(value, ...args)))

  const events = pipe(juxt([
    pipe(paths([sink('next', []), [...state, 'value$']]), vnode),
    pipe(paths([[...ns, 'change$'], [...state, 'update']]),change)
  ]), flatten, apply(merge))

  return {hooks, events, ns}
}

module.exports = {create}