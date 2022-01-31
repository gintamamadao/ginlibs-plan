import Plan from '../index'

const noop = () => undefined

describe('事件计划 Plan', () => {
  test('事件权重 1', () => {
    const plan = new Plan()
    plan.addToPlan({
      name: 'a',
      handle: noop,
      weight: 1,
    })
    plan.addToPlan({
      name: 'b',
      handle: noop,
      weight: 10,
    })
    plan.addToPlan({
      name: 'c',
      handle: noop,
      weight: 100,
    })
    plan.addToPlan({
      name: 'd',
      handle: noop,
      weight: 1000,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['d', 'c', 'b', 'a'])
    )
  })

  test('事件权重 2', () => {
    const plan = new Plan()
    plan.addToPlan({
      name: 'a',
      handle: noop,
      weight: 1,
    })
    plan.addToPlan({
      name: 'b',
      handle: noop,
      weight: 100,
    })
    plan.addToPlan({
      name: 'c',
      handle: noop,
      weight: 10,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['b', 'c', 'a'])
    )
  })

  test('事件权重 3', () => {
    const plan = new Plan()
    plan.addToPlan({
      name: 'a',
      handle: noop,
    })
    plan.addToPlan({
      name: 'b',
      handle: noop,
    })
    plan.addToPlan({
      name: 'c',
      handle: noop,
    })
    plan.addToPlan({
      name: 'd',
      handle: noop,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['a', 'b', 'c', 'd'])
    )
  })

  test('事件权重 4', () => {
    const plan = new Plan()
    plan.addToPlan({
      name: 'a',
      handle: noop,
    })
    plan.addToPlan({
      name: 'b',
      handle: noop,
      weight: 10,
    })
    plan.addToPlan({
      name: 'c',
      handle: noop,
      weight: 10,
    })
    plan.addToPlan({
      name: 'd',
      handle: noop,
      weight: 10,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['b', 'c', 'd', 'a'])
    )
  })

  test('事件权重 5', () => {
    const plan = new Plan()
    plan.addToPlan({
      name: 'a',
      handle: noop,
      weight: 1,
    })
    plan.addToPlan({
      name: 'a-1',
      handle: noop,
      before: 'a',
    })
    plan.addToPlan({
      name: 'a-2',
      handle: noop,
      before: 'a',
    })
    plan.addToPlan({
      name: 'b',
      handle: noop,
      weight: 10,
    })
    plan.addToPlan({
      name: 'c',
      handle: noop,
      weight: 10,
    })
    plan.addToPlan({
      name: 'd',
      handle: noop,
      weight: 10,
    })
    plan.addToPlan({
      name: 'e',
      handle: noop,
      weight: 100,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['e', 'b', 'c', 'd', 'a-1', 'a-2', 'a'])
    )
  })

  test('事件权重 6', () => {
    const plan = new Plan()
    plan.addToPlan({
      name: 'a',
      handle: noop,
      weight: 1,
    })
    plan.addToPlan({
      name: 'a-1',
      handle: noop,
      before: 'a',
    })
    plan.addToPlan({
      name: 'a-1-1',
      handle: noop,
      before: 'a-1',
    })
    plan.addToPlan({
      name: 'a-1-1-1',
      handle: noop,
      before: 'a-1-1',
    })
    plan.addToPlan({
      name: 'a-2',
      handle: noop,
      before: 'a',
    })
    plan.addToPlan({
      name: 'b',
      handle: noop,
      weight: 10,
    })
    plan.addToPlan({
      name: 'c',
      handle: noop,
      weight: 10,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['b', 'c', 'a-1-1-1', 'a-1-1', 'a-1', 'a-2', 'a'])
    )
  })
})
