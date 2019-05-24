const {propEq,pipe,juxt,flatten,apply,remove} = require('ramda');
const {merge} = require('rxjs');
const {tap,filter,map} = require('rxjs/operators');
const {paths} = require('../../../../vendor/subak/ramda')

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
      map(([checked, ...args]) =>
        [
          view({
            checked,
            change: ev =>
              events$.next([`${NS}.change`, ev, ...args])
          }),
          ...args
        ]),
      map(([vnode, ...args]) =>
        [`${NS}.vnode`, vnode, ...args]))

  const change = ([change$, update]) =>
    change$.pipe(
      map(([{target:{checked}}, ...args]) =>
        update(checked, ...args)))

  const events = pipe(juxt([
    pipe(paths([['events$'], [...state, 'value$']]), vnode),
    pipe(paths([[...ns, 'change$'], [...state, 'update']]),change)
  ]), flatten, apply(merge))

  return {hooks, events}
}

module.exports = {create}