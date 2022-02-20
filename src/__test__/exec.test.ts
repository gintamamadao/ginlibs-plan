import Plan from '../index'

describe('Plan 同步计划值传递', () => {
  test('同步计划值传递', async () => {
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
