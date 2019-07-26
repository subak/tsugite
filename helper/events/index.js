const {pipe,apply,juxt,flatten,prop,propEq,not,nth,hasPath,isNil,path,reject,equals,assocPath} = require('ramda')
const {merge,Subject,of,zip} = require('rxjs')
const {tap, filter, map, takeWhile, catchError, concatMap, scan, distinctUntilChanged, delay,groupBy,share} = require('rxjs/operators')
const {paths} = require('../../ramda')

const {createHooks} = require('../hooks');

const source = (key, ns) =>
  [...ns, key, 'source$']

const sink = (key, ns) =>
  [...ns, key, 'sink']

const next = (key, ns) =>
  [...ns, key, 'next']

const update = (key, ns) =>
  [...ns, key, 'update']

const useWith = (func, ...args) =>
  pipe(paths([...args]), apply(func))

const mergeEvents = (...events) =>
  pipe(juxt([...events]), flatten, apply(merge))


const createRoot = (locals=[], remotes=[]) => {
  const rootHooks = hooks => ({
    ...hooks,
    ...createHooks(['init', 'terminate', 'terminated'], [], hooks)
  })

  const hooks = [
    rootHooks,
    ...locals.map(prop('hooks')),
    ...remotes.map(prop('hooks'))
  ]

  const events = locals.map(prop('events'))

  return pipe(...hooks, juxt(events), flatten, apply(merge))
}

const mount = (events,mounter) => {
  const events$ = new Subject,
    observable$ = events$.asObservable()

  mounter(events({
    events$: observable$,
    next: {
      sink: ev =>
        events$.next(ev)
    },
    group$: observable$.pipe(
      groupBy(nth(0))),
  })).pipe(
    takeWhile(pipe(propEq(0, 'terminated'), not)))
    .subscribe(events$)

  events$.next(['init'])

  return events$;
}

const createUnitEvent = idxs =>
  (unit$, sink) =>
    unit$.pipe(
      filter(pipe(nth(0), isNil, not)),
      filter(pipe(nth(0), hasPath(idxs))),
      map(([unit, ...indexes]) =>
        [path(idxs, unit), ...indexes]),
      map(apply(sink)))

const useUnit = (idxs, sourceNs, sinkNs) =>
  useWith(createUnitEvent(idxs), source('unit', sourceNs), sink('unit', sinkNs))

const createDataEvent = idxs =>
  (unit$, data$, sink) =>
    zip(unit$, data$).pipe(
      tap(value =>
        value),
      filter(pipe(path([0, 0]), isNil, not)),
      filter(pipe(path([0, 0]), hasPath(idxs))),
      map(([[unit, ...indexes], [data]]) =>
        [path(idxs, data), ...indexes]),
      map(apply(sink)))

const useData = (idxs, sourceNs, sinkNs) =>
  useWith(createDataEvent(idxs), source('unit', sourceNs), source('data', sourceNs), sink('data', sinkNs))

const createRootUnit = seed =>
  (update$, sink) =>
    update$.pipe(
      map(([value, path]) =>
        [assocPath(path, value, seed)]),
      map(apply(sink)))

const useRootUnit = (seed, ns) =>
  useWith(createRootUnit(seed), source('update', ns), sink('unit', ns))

const createRootData = seed =>
  (update$, sink) =>
    update$.pipe(
      scan((acc,[value, path]) =>
        assocPath(path, value, acc) ,seed),
      map(data =>
        [data]),
      map(apply(sink)))

const useRootData = (seed, ns) =>
  useWith(createRootData(seed), source('update', ns), sink('data', ns))

const createModifyEvent = (isDelay=false) =>
  (data$, sink) => {
    const stream$ = data$.pipe(
      distinctUntilChanged(([prev], [curr]) =>
        reject(isNil, prev).length === reject(isNil, curr).length),
      map(apply(sink)))

    return isDelay ? stream$.pipe(delay(0)) : stream$
  }

const useModify = ns =>
  useWith(createModifyEvent(), source('data', ns), sink('modify', ns))

const useModified = ns =>
  useWith(createModifyEvent(true), source('data', ns), sink('modified', ns))

const createElementUnit = () =>
  (el$, sink) =>
    el$.pipe(
      concatMap(([els, ...indexes]) =>
        of(...reject(isNil, els.map((el, idx) =>
          [el, ...indexes, idx])))),
      map(apply(sink)))

const useElementUnit = (sourceNs, sinkNs) =>
  useWith(createElementUnit(), source('unit', sourceNs), sink('unit', sinkNs))

const createElementDataEvent = () =>
  (unit$, data$, sink) =>
    zip(unit$, data$).pipe(
      concatMap(([[unit, ...indexes], [data]]) =>
        of(...reject(isNil, unit.map((row, idx) =>
          [data[idx], ...indexes, idx])))),
      map(apply(sink)))

const useElementData = (sourceNs, sinkNs) =>
  useWith(createElementDataEvent(), source('unit', sourceNs), source('data', sourceNs), sink('data', sinkNs))

module.exports = {source, sink, useWith,
  mergeEvents, createRoot, mount, next,
  update, useUnit, useData, useRootUnit, useRootData,
  useModify, useModified, useElementUnit, useElementData
}

