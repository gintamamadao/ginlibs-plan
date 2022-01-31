import Plan from '../index'

describe('事件计划 Plan', () => {
  test('事件权重 1', () => {
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
      name: 'b',
      handle: () => {
        str = str + 'b'
      },
      weight: 10,
    })
    plan.addToPlan({
      name: 'c',
      handle: () => {
        str = str + 'c'
      },
      weight: 100,
    })
    plan.addToPlan({
      name: 'd',
      handle: () => {
        str = str + 'd'
      },
      weight: 1000,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['d', 'c', 'b', 'a'])
    )
    plan.execPlan()

    expect(str).toBe('dcba')
  })

  test('事件权重 2', () => {
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
      name: 'b',
      handle: () => {
        str = str + 'b'
      },
      weight: 100,
    })
    plan.addToPlan({
      name: 'c',
      handle: () => {
        str = str + 'c'
      },
      weight: 10,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['b', 'c', 'a'])
    )
    plan.execPlan()

    expect(str).toBe('bca')
  })

  test('事件权重 3', () => {
    const plan = new Plan()
    let str = ''
    plan.addToPlan({
      name: 'a',
      handle: () => {
        str = str + 'a'
      },
    })
    plan.addToPlan({
      name: 'b',
      handle: () => {
        str = str + 'b'
      },
    })
    plan.addToPlan({
      name: 'c',
      handle: () => {
        str = str + 'c'
      },
    })
    plan.addToPlan({
      name: 'd',
      handle: () => {
        str = str + 'd'
      },
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['a', 'b', 'c', 'd'])
    )
    plan.execPlan()

    expect(str).toBe('abcd')
  })

  test('事件权重 4', () => {
    const plan = new Plan()
    let str = ''
    plan.addToPlan({
      name: 'a',
      handle: () => {
        str = str + 'a'
      },
    })
    plan.addToPlan({
      name: 'b',
      handle: () => {
        str = str + 'b'
      },
      weight: 10,
    })
    plan.addToPlan({
      name: 'c',
      handle: () => {
        str = str + 'c'
      },
      weight: 10,
    })
    plan.addToPlan({
      name: 'd',
      handle: () => {
        str = str + 'd'
      },
      weight: 10,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['b', 'c', 'd', 'a'])
    )
    plan.execPlan()

    expect(str).toBe('bcda')
  })

  test('事件权重 5', () => {
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
      name: 'a-1',
      handle: () => {
        str = str + 'a-1'
      },
      before: 'a',
    })
    plan.addToPlan({
      name: 'a-2',
      handle: () => {
        str = str + 'a-1'
      },
      before: 'a',
    })
    plan.addToPlan({
      name: 'b',
      handle: () => {
        str = str + 'b'
      },
      weight: 10,
    })
    plan.addToPlan({
      name: 'c',
      handle: () => {
        str = str + 'c'
      },
      weight: 10,
    })
    plan.addToPlan({
      name: 'd',
      handle: () => {
        str = str + 'd'
      },
      weight: 10,
    })
    plan.addToPlan({
      name: 'e',
      handle: () => {
        str = str + 'd'
      },
      weight: 100,
    })

    expect(plan.getPlan()).toStrictEqual(
      expect.objectContaining(['e', 'b', 'c', 'd', 'a-1', 'a-2', 'a'])
    )
  })
})
