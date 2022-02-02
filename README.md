# ginlibs-plan

[![NPM version](https://badgen.net/npm/v/ginlibs-plan)](https://www.npmjs.com/package/ginlibs-plan)
[![NPM Weekly Downloads](https://badgen.net/npm/dw/ginlibs-plan)](https://www.npmjs.com/package/ginlibs-plan)
[![License](https://badgen.net/npm/license/ginlibs-plan)](https://www.npmjs.com/package/ginlibs-plan)

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

> 注意：用相同权重的事件采用队列的模式，先注册先执行，后注册后执行

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
  name: 'a-1',
  handle: () => {
    str = str + 'a-1'
  },
  after: 'a',
  weight: 100,
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

// a 是 a-2，a-1 的事件的依赖，需要在 a-2，a-1 之前执行，所以顺序是 b -> a -> a-1 -> a-2
```

> 注意：依赖和权重同时存在的事件，权重将仅在有着相同依赖关系的事件之间进行比较，例如上面的例子，a-1 的权重是 100，但是 a-1 有着依赖关系，所以只会和有着相同依赖关系 a-2 的权重做比较区分先后，所以 a-1 执行的顺序是在 a-2 之前，但是在 b，a 之后，因为 a 是 a-1 的事件的依赖，所以必然在 a 之后，b 的权重比 a 高，所以 b 执行的顺序在 a 的前面，才得到了最后的顺序。

# API

### 初始化 `new Plan(context, isAsync)`

- 初始化时可以加入上下文，
  - context 参数，作为每个事件函数的上下文
  - isAsync 参数，默认为 false, 如果是 true 表示当前事件计划是异步执行的
    - 异步计划中的中所有的事件都将变成异步执行
    - 异步计划中的事件仍然按照顺序串行执行，即如果当前事件返回一个 Promise，那必须等到 Promise 执行完成才允许执行下一个事件

```js
const plan = new Plan(context, false)
```

### 添加事件 `addToPlan(info)`

- 添加需要执行的事件
  - info 参数，事件的相关信息，结构如下
    - name，必要，表示事件名
    - handle，必要，表示事件函数，一个事件可以注册多个事件函数
    - before 表示在某事件之前执行
    - after 表示在某事件之后执行
    - before 和 after 不能同时存在

```ts
interface Info {
  name: string
  handle: AnyFunction
  weight?: number
  before?: string
  after?: string
}
```

- 例子

```js
plan.addToPlan({
  name: 'a',
  handle: () => {
    // todo
  },
  weight: 1,
})
```

### `isPlanEvent(eventName)`

- 判断事件是否在计划之中

### `getPlan()`

- 获取当前事件执行的顺序，以数组的形式返回

### `execPlan()`

- 执行事件计划

### `execAsyncPlan()`

- 执行异步事件计划，该函数执行会返回一个 Promise 对象，用于判断事件是否完成

```js
await plan.execAsyncPlan()
```

# Test Report

> Tests are using jest, to run the tests use:

```sh
$ npm run test:cov
```

report detail

```sh
----------|---------|----------|---------|---------|-------------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------------
All files |     100 |    86.67 |     100 |     100 |
 index.ts |     100 |    86.67 |     100 |     100 | 55-65,80,97,109,121,133
----------|---------|----------|---------|---------|-------------------------

Test Suites: 5 passed, 5 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        3.091 s
```

---
