# ginlibs-plan

用于处理多个注册事件执行顺序，可以设置事件的权重，依赖事件，从而获得目标的执行顺序

# 使用

### 事件按权重执行

```js
import Plan from 'ginlibs-plan'

let str = ''

const plan = new Plan()
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

// 根据权重 weight 的值，执行顺序是 c -> b -> a
```

### 事件按前置依赖关系 before 执行

```js
import Plan from 'ginlibs-plan'

let str = ''

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
  weight: 1,
})
plan.addToPlan({
  name: 'b',
  handle: () => {
    str = str + 'b'
  },
  weight: 10,
})

// a-1 是 a 的事件的依赖，需要在 a 之前执行，所以顺序是 b -> a-1 -> a
```

### 事件按前置依赖关系 after 执行

```js
import Plan from 'ginlibs-plan'

let str = ''

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
  name: 'a-2',
  handle: () => {
    str = str + 'a-2'
  },
  after: 'a',
  weight: 1,
})
plan.addToPlan({
  name: 'b',
  handle: () => {
    str = str + 'b'
  },
  weight: 10,
})

// a 是 a-2 的事件的依赖，需要在 a-2 之前执行，所以顺序是 b -> a -> a-2
```

# API

### `addToPlan(info)`

- 添加事件

### `getPlan()`

- 获取当前事件执行的顺序

### `execPlan()`

- 执行事件
