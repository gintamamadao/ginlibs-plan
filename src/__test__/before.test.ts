import Plan from '../index'

const noop = () => undefined

describe('事件计划 Plan', () => {
  test('before 1', async () => {
    const plan = new Plan()
    plan.addToPlan({
      name: 'a',
      handle: noop,
      weight: 1,
    })
    plan.addToPlan({
      name: 'a1',
      handle: noop,
      before: 'a',
      weight: 1,
    })
    plan.addToPlan({
      name: 'a2',
      handle: noop,
      before: 'a',
      weight: 1,
    })
    plan.addToPlan({
      name: 'a3',
      handle: noop,
      before: 'a',
      weight: 10,
    })
    plan.addToPlan({
      name: 'b',
      handle: noop,
      weight: 10,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['b', 'a3', 'a1', 'a2', 'a'])
    )
  })
})
