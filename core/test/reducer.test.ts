import { describe, test, expect } from '@jest/globals'
import {
  parseFn,
  mulFn,
  divFn,
  pow10Fn,
  roundFn,
  indexFn,
  requestResponseReducerMapping
} from '../src/worker/reducer'
import { buildReducer } from '../src/worker/utils'
import { pipe } from '../src/utils'

describe('Reducers', function () {
  test('parseFn with array input', function () {
    const obj = {
      RAW: { ETH: { USD: { PRICE: 123 } } },
      DISPLAY: { ETH: { USD: [Object] } }
    }
    const fn = parseFn(['RAW', 'ETH', 'USD', 'PRICE'])
    fn(obj)
    expect(fn(obj)).toBe(123)
  })

  test('parseFn with string input', function () {
    const obj = {
      RAW: { ETH: { USD: { PRICE: 123 } } },
      DISPLAY: { ETH: { USD: [Object] } }
    }
    const fn = parseFn('RAW,ETH,USD,PRICE')
    fn(obj)
    expect(fn(obj)).toBe(123)
  })

  test('Mul', function () {
    expect(mulFn(2)(3)).toBe(6)
  })

  test('Div', function () {
    expect(divFn(2)(8)).toBe(4)
  })

  test('Build mul reducer', function () {
    // 2 * 3 = 6
    const request = [{ function: 'mul', args: 3 }]
    const reducers = buildReducer(requestResponseReducerMapping, request)
    expect(pipe(...reducers)(2)).toBe(6)
  })

  test('Mul & div reducer', function () {
    // 10 * 8 / 2 = 40
    const request = [
      { function: 'mul', args: 8 },
      { function: 'div', args: 2 }
    ]
    const reducers = buildReducer(requestResponseReducerMapping, request)
    expect(pipe(...reducers)(10)).toBe(40)
  })

  test('Div & round reducer', function () {
    // round(3 / 2) = 2
    const request = [{ function: 'div', args: 2 }, { function: 'round' }]
    const reducers = buildReducer(requestResponseReducerMapping, request)
    expect(pipe(...reducers)(3)).toBe(2)
  })

  test('Pow10', function () {
    // (10 ** 4) * 1
    expect(pow10Fn(4)(1)).toBe(10_000)
    // (10 ** 4) * 2
    expect(pow10Fn(4)(2)).toBe(20_000)
  })

  test('Round', function () {
    expect(roundFn()(1.1)).toBe(1)
    expect(roundFn()(1.5)).toBe(2)
    expect(roundFn()(1.9)).toBe(2)
  })

  test('Index below lower boundary', function () {
    const arr = [1, 2, 3]
    expect(() => indexFn(-1)(arr)).toThrow()
  })

  test('Index above higher boundary', function () {
    const arr = [1, 2, 3]
    expect(() => indexFn(3)(arr)).toThrow()
  })

  test('Index', function () {
    const arr = [1, 2, 3]
    expect(indexFn(1)(arr)).toBe(2)
  })
})
