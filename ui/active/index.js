const {propEq,pipe,juxt,flatten,apply,remove} = require('ramda');
const {merge} = require('rxjs');
const {tap,filter,map} = require('rxjs/operators');
const {paths} = require('../../../../vendor/subak/ramda')

const create = (ns, state, view, targetValue) => {
  const NS = ns.join('.')

  const hooks = ({events$}) => ({
    vnode$: events$.pipe(
      filter(propEq(0, `${NS}.vnode`)),
      map(remove(0,1))),
    change$: events$.pipe(
      filter(propEq(0, `${NS}.change`)),
      map(remove(0,1))),
    change: (...args) =>
      events$.next([`${NS}.change`, ...args])
  })

  const vnode = (change, value$) =>
    value$.pipe(
      map(([value, ...args]) =>
        [
          view({
            active: value === targetValue,
            change: ev =>
              change(targetValue, ev, ...args)
          }),
          ...args
        ]),
      map(([vnode, ...args]) =>
        [`${NS}.vnode`, vnode, ...args]))

  const change = (change$, update) =>
    change$.pipe(
      map(([value, , ...args]) =>
        update(value, ...args)))

  const events = pipe(juxt([
    pipe(paths([[...ns, 'change'], [...state, 'value$']]), apply(vnode)),
    pipe(paths([[...ns, 'change$'], [...state, 'update']]), apply(change))
  ]), flatten, apply(merge))

  return {hooks, events}
}

module.exports = {create}