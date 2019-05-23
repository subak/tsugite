const {input} = require('@cycle/dom');
const {propEq,pipe,juxt,flatten,apply,mergeLeft} = require('ramda');
const {filter,map} = require('rxjs/operators');
const {paths} = require('../../../../vendor/subak/ramda')

const create = (ns, state, view) => {
  const NS = ns.join('.')

  const hooks = ({events$}) => ({
    vnode$: events$.pipe(
      filter(propEq(0, `${NS}.vnode`)),
    ),
    change$: events$.pipe(
      filter(propEq(0, `${NS},change`)),
      map(([,...args]) =>
        args))
  })

  const vnode = ([events$, value$]) =>
    value$.pipe(
      map(([value, ...args]) =>
        [
          view({
            value,
            change: ev =>
              events$.next([`${NS}.change`, ev, ...args])}),
          ...args
        ]),
      map(([vnode, ...args]) =>
        [`${NS}.vnode`, vnode, ...args]))

  const change = ([change$, update]) =>
    change$.pipe(
      map(([{target:{value}, ...args}]) =>
        update(value, ...args)))

  const events = pipe(juxt([
    pipe(paths([['events$'], [...state, 'value$']]), vnode),
    pipe(paths([[...ns, 'change$'], [...state, 'update']]),change)
  ]), flatten, apply(merge))

  return {hooks, events}
}

module.exports = {create}