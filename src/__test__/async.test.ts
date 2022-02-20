import Plan from '../index'
import { sleep } from 'ginlibs-utils'
import { AsyncLock } from 'ginlibs-lock'

describe('异步事件计划 Plan', () => {
  test('异步事件执行顺序', async () => {
    const plan = new Plan({}, true)
    let str = ''
    const ala = new AsyncLock()
    const alb = new AsyncLock()
    const alc = new AsyncLock()
    plan.addToPlan({
      name: 'a',
      handle: async () => {
        await sleep(100)
        str = str + 'a'
        ala.unLock()
      },
    })
    plan.addToPlan({
      name: 'b',
      handle: async () => {
        await sleep(50)
        str = str + 'b'
        alb.unLock()
      },
    })
    plan.addToPlan({
      name: 'c',
      handle: async () => {
        await sleep(50)
        str = str + 'c'
        alc.unLock()
      },
      weight: 10,
    })
    plan.addToPlan({
      name: 'd',
      handle: () => {
        str = str + 'd'
      },
      weight: 100,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['d', 'c', 'a', 'b'])
    )
    plan.execPlan()
    await sleep(0)
    expect(str).toBe('d')

    await sleep(20)
    expect(str).toBe('d')

    await alc.getLock()
    expect(str).toBe('dc')

    await ala.getLock()
    expect(str).toBe('dca')

    await alb.getLock()
    expect(str).toBe('dcab')
  })

  test('异步事件执行完成', async () => {
    const plan = new Plan({}, true)
    let str = ''
    plan.addToPlan({
      name: 'a',
      handle: async () => {
        await sleep(100)
        str = str + 'a'
      },
    })
    plan.addToPlan({
      name: 'b',
      handle: async () => {
        await sleep(30)
        str = str + 'b'
      },
    })
    plan.addToPlan({
      name: 'c',
      handle: async () => {
        await sleep(0)
        str = str + 'c'
      },
    })
    plan.addToPlan({
      name: 'd',
      handle: async () => {
        await sleep(0)
        str = str + 'd'
      },
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['a', 'b', 'c', 'd'])
    )
    expect(str).toBe('')

    await sleep(50)
    expect(str).toBe('')

    await plan.execAsyncPlan()
    expect(str).toBe('abcd')
  })
})
