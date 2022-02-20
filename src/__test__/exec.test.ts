import Plan from '../index'

const noop = () => undefined

describe('事件计划 Plan', () => {
  test('addToPlan', async () => {
    const plan = new Plan()
    let str = ''
    plan.addToPlan({
      name: 'a',
      handle: () => {
        str += '1'
      },
      weight: 10,
    })
    plan.addToPlan({
      name: 'a',
      handle: () => {
        str += '2'
      },
      weight: 10,
    })

    plan.execPlan()

    expect(str).toBe('12')
  })

  test('addToPlan throw error', async () => {
    const plan = new Plan()
    plan.addToPlan({
      name: 'a',
      handle: noop,
    })

    expect(() => {
      plan.addToPlan({
        name: 'a-1',
        handle: noop,
        before: 'a',
        after: 'a',
      })
    }).toThrow()

    expect(() => {
      plan.addToPlan({
        name: 'a-1',
        handle: noop,
        before: 'b',
      })
    }).toThrow()

    expect(() => {
      plan.addToPlan({
        name: 'a-1',
        handle: noop,
        after: 'b',
      })
    }).toThrow()
  })

  test('isPlanEvent', async () => {
    const plan = new Plan()
    plan.addToPlan({
      name: 'a',
      handle: noop,
      weight: 10,
    })

    expect(plan.isPlanEvent('a')).toBe(true)
    expect(plan.isPlanEvent('b')).toBe(false)
  })

  test('getPlanInfo', async () => {
    const plan = new Plan()
    plan.addToPlan({
      name: 'a',
      handle: noop,
      weight: 10,
    })
    const infos = plan.getPlanInfos()

    expect(infos[0].name).toBe('a')
    expect(infos[0].weight).toBe(10)
  })

  test('after & before', async () => {
    const plan = new Plan()
    plan.addToPlan({
      name: 'a',
      handle: noop,
      weight: 10,
    })
    plan.addToPlan({
      name: 'a1',
      handle: noop,
      before: 'a',
      weight: 100,
    })
    plan.addToPlan({
      name: 'a2',
      handle: noop,
      after: 'a',
      weight: 100,
    })
    plan.addToPlan({
      name: 'b',
      handle: noop,
      weight: 1,
    })
    plan.addToPlan({
      name: 'c',
      handle: noop,
      weight: 100,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['c', 'a1', 'a', 'a2', 'b'])
    )
  })
})
