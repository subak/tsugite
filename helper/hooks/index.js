const {propEq,remove,mergeAll,mergeDeepLeft,identity} = require('ramda')
const {tap,map,filter,switchMap,share} = require('rxjs/operators')

const createHook = (key, ns, hooks) =>
  ({
    [key]: {
      sink: (...args) =>
        [ns.concat(key).join('.'), ...args],
      source$: hooks.group$.pipe(
        filter(propEq('key', ns.concat(key).join('.'))),
        switchMap(identity),
        map(remove(0,1)),
        share()),
      next: (...args) =>
        hooks.next(ns.concat(key).join('.'), ...args)
    }
  })

const createHooks = (keys, ns, hooks) =>
  mergeAll(keys.map(key =>
    createHook(key, ns, hooks)))

const createStoreHook = (ns, hooks, type) =>
  ({
    [`${type}$`]: hooks.events$.pipe(
      filter(propEq(0, ns.concat(type))),
      tap(value =>
        value),
      map(remove(0,1)))
  })

const createUnitHook = (key, ns, hooks) =>
  createStoreHook(key, ns, hooks, 'unit')


const createDataHook = (...args) =>
  createStoreHook(...args, 'data')

const createBreakingHook = (...args) =>
  createStoreHook(...args, 'breaking')

const createStoreItemHook = (...args) =>
  ({
    ...createUnitHook(...args),
    ...createDataHook(...args)
  })

const createStoreArrayHook = (key, ns, hooks) =>
  ({
    ...createStoreItemHook(key, ns, hooks),
    ...createBreakingHook(key, ns, hooks)
  })

const createUpdateHook = (ns, callback) =>
  ({
    update: {
      sink: (value, ...args) =>
        [ns.concat('update').join('.'), value, callback(...args)]
    }
  })

const createUpdateInitialHook = (ns, initial, callback) =>
  ({
    update: {
      sink: (value, ...args) =>
        [
          ns.concat('update').join('.'),
          value && mergeDeepLeft(value, initial),
          callback(...args)
        ]
    }
  })

module.exports = {createHook, createHooks, createUpdateHook, createUpdateInitialHook, createUnitHook}
