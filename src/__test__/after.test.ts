import Plan from '../index'

describe('事件计划 Plan', () => {
  test('after', async () => {
    const plan = new Plan()
    let str = ''
    plan.addToPlan({
      name: 'a',
      handle: () => {
        str = str + 'a'
      },
      weight: 1,
    })
    plan.addToPlan({
      name: 'a1',
      handle: () => {
        str = str + 'a1'
      },
      after: 'a',
      weight: 1,
    })
    plan.addToPlan({
      name: 'a2',
      handle: () => {
        str = str + 'a2'
      },
      after: 'a',
      weight: 1,
    })
    plan.addToPlan({
      name: 'a3',
      handle: () => {
        str = str + 'a3'
      },
      after: 'a',
      weight: 10,
    })
    plan.addToPlan({
      name: 'b',
      handle: () => {
        str = str + 'b'
      },
      weight: 10,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['b', 'a', 'a3', 'a1', 'a2'])
    )
  })
})
