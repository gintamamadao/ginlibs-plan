import Plan from '../index'

const noop = () => undefined

describe('事件计划 Plan', () => {
  test('after 1', async () => {
    const plan = new Plan()
    plan.addToPlan({
      name: 'a',
      handle: noop,
    })
    plan.addToPlan({
      name: 'a1',
      handle: noop,
      after: 'a',
    })
    plan.addToPlan({
      name: 'a2',
      handle: noop,
      after: 'a',
    })
    plan.addToPlan({
      name: 'a3',
      handle: noop,
      after: 'a',
    })
    plan.addToPlan({
      name: 'b',
      handle: noop,
      weight: 10,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['b', 'a', 'a1', 'a2', 'a3'])
    )
  })

  test('after 2', async () => {
    const plan = new Plan()
    plan.addToPlan({
      name: 'a',
      handle: noop,
      weight: 10,
    })
    plan.addToPlan({
      name: 'a1',
      handle: noop,
      after: 'a',
      weight: 1,
    })
    plan.addToPlan({
      name: 'a2',
      handle: noop,
      after: 'a',
      weight: 10,
    })
    plan.addToPlan({
      name: 'a3',
      handle: noop,
      after: 'a',
      weight: 100,
    })
    plan.addToPlan({
      name: 'a4',
      handle: noop,
      after: 'a',
      weight: 100,
    })
    plan.addToPlan({
      name: 'b',
      handle: noop,
      weight: 1,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['a', 'a3', 'a4', 'a2', 'a1', 'b'])
    )
  })

  test('after 3', async () => {
    const plan = new Plan()
    plan.addToPlan({
      name: 'a',
      handle: noop,
      weight: 10,
    })
    plan.addToPlan({
      name: 'a1',
      handle: noop,
      after: 'a',
      weight: 10,
    })
    plan.addToPlan({
      name: 'a1-1',
      handle: noop,
      after: 'a1',
    })
    plan.addToPlan({
      name: 'a1-1-1',
      handle: noop,
      after: 'a1-1',
    })
    plan.addToPlan({
      name: 'a2',
      handle: noop,
      after: 'a',
      weight: 1,
    })
    plan.addToPlan({
      name: 'b',
      handle: noop,
      weight: 1,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['a', 'a1', 'a1-1', 'a1-1-1', 'a2', 'b'])
    )
  })
})
