import Plan from '../index'
import { sleep } from 'ginlibs-utils'

describe('异步事件计划 Plan', () => {
  test('异步事件执行顺序', async () => {
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
        await sleep(60)
        str = str + 'b'
      },
    })
    plan.addToPlan({
      name: 'c',
      handle: async () => {
        await sleep(100)
        str = str + 'c'
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

    await sleep(50)
    expect(str).toBe('d')

    await sleep(60)
    expect(str).toBe('dc')

    await sleep(100)
    expect(str).toBe('dca')

    await sleep(60)
    expect(str).toBe('dcab')
  })
})
