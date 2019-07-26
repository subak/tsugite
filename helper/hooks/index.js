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

module.exports = {createHook, createHooks, createUpdateHook, createUpdateInitialHook}
