import Plan from '../index'
import { sleep } from 'ginlibs-utils'

describe('Plan 同步计划值传递', () => {
  test('同步计划值传递 1', async () => {
    const plan = new Plan()
    let str = ''
    plan.addToPlan({
      name: 'a',
      handle: (prev) => {
        expect(prev.pervEventName).toBe(undefined)
        expect(prev.prevEventRes[0]).toBe(undefined)
        return '1'
      },
    })
    plan.addToPlan({
      name: 'b',
      handle: (prev) => {
        expect(prev.pervEventName).toBe('a')
        expect(prev.prevEventRes[0]).toBe('1')
        str += prev.prevEventRes[0]
        return '2'
      },
    })
    plan.addToPlan({
      name: 'c',
      handle: (prev) => {
        expect(prev.pervEventName).toBe('b')
        expect(prev.prevEventRes[0]).toBe('2')
        str += prev.prevEventRes[0]
      },
    })

    plan.execPlan()

    expect(str).toBe('12')
  })
})

describe('Plan 异步计划值传递', () => {
  test('异步计划值传递 1', async () => {
    const plan = new Plan({}, true)
    let str = ''
    plan.addToPlan({
      name: 'a',
      handle: async (prev) => {
        expect(prev.pervEventName).toBe(undefined)
        expect(prev.prevEventRes?.[0]).toBe(undefined)
        await sleep(30)
        return '1'
      },
    })
    plan.addToPlan({
      name: 'b',
      handle: async (prev) => {
        expect(prev.pervEventName).toBe('a')
        expect(prev.prevEventRes?.[0]).toBe('1')
        str += prev?.prevEventRes?.[0]
        await sleep(30)
        return '2'
      },
    })
    plan.addToPlan({
      name: 'c',
      handle: async (prev) => {
        expect(prev.pervEventName).toBe('b')
        expect(prev.prevEventRes?.[0]).toBe('2')
        await sleep(30)
        str += prev?.prevEventRes?.[0]
      },
    })

    await plan.execAsyncPlan()
    expect(str).toBe('12')
  })
  test('异步计划值传递 2', async () => {
    const plan = new Plan({}, true)
    let str = ''
    plan.addToPlan({
      name: 'a',
      handle: async () => {
        await sleep(30)
        return '1'
      },
    })
    plan.addToPlan({
      name: 'b',
      handle: async (prev) => {
        expect(prev.pervEventName).toBe('a')
        expect(prev.prevEventRes?.[0]).toBe('1')
        str += prev?.prevEventRes?.[0]
        await sleep(30)
        return 'b-1'
      },
    })
    plan.addToPlan({
      name: 'b',
      handle: async (prev) => {
        expect(prev.pervEventName).toBe('a')
        expect(prev.prevEventRes?.[0]).toBe('1')
        await sleep(30)
        return 'b-2'
      },
    })
    plan.addToPlan({
      name: 'c',
      handle: async (prev) => {
        expect(prev.pervEventName).toBe('b')
        expect(prev.prevEventRes?.[0]).toBe('b-1')
        expect(prev.prevEventRes?.[1]).toBe('b-2')
        await sleep(30)
      },
    })

    await plan.execAsyncPlan()
  })
})
