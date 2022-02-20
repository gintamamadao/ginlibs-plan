import { Chain } from 'ginlibs-chain'
import { Events } from 'ginlibs-events'
import { isFunc } from 'ginlibs-type-check'
import { AsyncLock } from 'ginlibs-lock'
import EventQueue from 'ginlibs-queue'

export interface EventPlanInfo {
  name: string
  handle: AnyFunction
  weight?: number
  before?: string
  after?: string
}
class Plan {
  private isAsync = false
  private eventChain: Chain
  private eventsEmitt: Events
  private eventQueue: EventQueue
  private planInfoMap: Record<string, EventPlanInfo> = {}
  private eventResultMap: Record<string, any[]> = {}

  constructor(context: any = {}, isAsync = false) {
    this.eventChain = new Chain()
    this.eventsEmitt = new Events(context)
    this.eventQueue = new EventQueue()
    this.isAsync = isAsync
  }

  private addAsyncEvent = (info: EventPlanInfo) => {
    const { name, handle } = info
    this.eventsEmitt.once(name, (pervEventName, context) => {
      this.eventQueue.add((prevEventRes: any) => {
        // 只做初始化，如果已经初始化完成那说明上一个事件重名就加入同名事件的结果
        if (this.eventResultMap[name]) {
          this.eventResultMap[name].push(prevEventRes)
        } else {
          const curResults = this.eventResultMap[name] || []
          this.eventResultMap[name] = curResults
        }

        if (pervEventName) {
          const pervResults = this.eventResultMap[pervEventName] || []
          pervResults.push(prevEventRes)
          this.eventResultMap[pervEventName] = pervResults
        }

        const pervInfo = {
          pervEventName,
          prevEventRes: this.eventResultMap[pervEventName] ?? [undefined],
        }

        return isFunc(handle) ? handle(pervInfo, context) : undefined
      })
    })
  }

  public addToPlan = (info: EventPlanInfo) => {
    const { name, handle, weight = 0, before, after } = info
    if (before && after) {
      throw new Error('before and after can not exist at the same time')
    }
    this.planInfoMap[name] = { ...info, weight }
    if (this.isAsync) {
      this.addAsyncEvent(info)
    } else {
      this.eventsEmitt.once(name, handle)
    }
    const eventNode = this.eventChain.find(name)
    if (eventNode) {
      return
    }
    if (!before && !after) {
      this.addByWeight(name, weight)
      return
    }
    if (before) {
      this.addByBefore(before, name, weight)
      return
    }
    if (after) {
      this.addByAfter(after, name, weight)
      return
    }
  }

  private addByWeight = (name: string, weight = 0) => {
    const heavierAnchorNode = this.eventChain.findFuncNode(
      (nodeVal: string) => {
        const itEventInfo = this.planInfoMap[nodeVal]
        const { weight: itWeight = 0, before, after } = itEventInfo
        return !before && !after && itWeight >= weight
      }
    )
    if (!heavierAnchorNode) {
      this.eventChain.unshift(name)
      return
    }

    let heavierNextEventNode = heavierAnchorNode.next
    while (heavierNextEventNode) {
      const nextEventInfo = this.planInfoMap[heavierNextEventNode.key]
      const {
        before: nextENBefor,
        after: nextENAfter,
        weight: nextENWeight = 0,
      } = nextEventInfo

      if (nextENBefor || nextENAfter || nextENWeight >= weight) {
        heavierNextEventNode = heavierNextEventNode.next
        continue
      }
      const lighterNodeKey = heavierNextEventNode.key
      const anchorKey = this.findNodeTopLegalBefore(lighterNodeKey)
      this.eventChain.insertBefore(anchorKey, name)
      return
    }

    this.eventChain.push(name)
    return
  }

  private addByBefore = (before: string, name: string, weight = 0) => {
    const anchorNode = this.eventChain.find(before)
    if (!anchorNode) {
      throw new Error('before event do not exist')
    }
    const beforeNodes = this.eventChain.findFuncNodes((nodeVal: string) => {
      const itEventInfo = this.planInfoMap[nodeVal]
      const { before: itBefore } = itEventInfo
      return itBefore === anchorNode.key
    })
    const lighterNodes = beforeNodes.filter((it) => {
      const itEventInfo = this.planInfoMap[it.key]
      const { weight: itWeight = 0 } = itEventInfo
      return itWeight < weight
    })
    if (beforeNodes.length <= 0 || lighterNodes.length <= 0) {
      this.eventChain.insertBefore(anchorNode.key, name)
      return
    }
    const lighterNode = lighterNodes[0]
    const anchorKey = this.findNodeTopLegalBefore(lighterNode.key)
    this.eventChain.insertBefore(anchorKey, name)
  }

  private addByAfter = (after: string, name: string, weight = 0) => {
    const anchorNode = this.eventChain.find(after)
    if (!anchorNode) {
      throw new Error('after event do not exist')
    }
    const afterNodes = this.eventChain.findFuncNodes((nodeVal: string) => {
      const itEventInfo = this.planInfoMap[nodeVal]
      const { after: itAfter } = itEventInfo
      return itAfter === anchorNode.key
    })
    const lighterNodes = afterNodes.filter((it) => {
      const itEventInfo = this.planInfoMap[it.key]
      const { weight: itWeight = 0 } = itEventInfo
      return itWeight < weight
    })
    if (afterNodes.length <= 0) {
      this.eventChain.insertAfter(anchorNode.key, name)
      return
    }
    if (lighterNodes.length <= 0) {
      const anchorKey = this.findNodeTopLegalAfter(anchorNode.key)
      this.eventChain.insertAfter(anchorKey, name)
      return
    }
    const lighterNode = lighterNodes[0]
    const anchorKey = this.findNodeTopLegalBefore(lighterNode.key)
    this.eventChain.insertBefore(anchorKey, name)
  }

  private findNodeTopLegalBefore = (nodeKey: string) => {
    const eventKeys = this.eventChain.getNodeKeys()
    const find = (findKey: string) => {
      for (const key of eventKeys) {
        const eventInfo = this.planInfoMap[key]
        if (key === findKey) {
          return key
        }
        if (eventInfo.before === findKey) {
          return find(key)
        }
      }
    }
    return find(nodeKey)
  }

  private findNodeTopLegalAfter = (nodeKey: string) => {
    const eventKeys = this.eventChain.getNodeKeys().reverse()
    const find = (findKey: string) => {
      for (const key of eventKeys) {
        const eventInfo = this.planInfoMap[key]
        if (key === findKey) {
          return key
        }
        if (eventInfo.after === findKey) {
          return find(key)
        }
      }
    }
    return find(nodeKey)
  }

  public getPlanInfos = () => {
    const plan = this.getPlan()
    return plan.map((name) => {
      return this.planInfoMap[name]
    })
  }

  public getPlan = () => {
    return this.eventChain.getNodeKeys()
  }

  public isPlanEvent = (eventName: string) => {
    const node = this.eventChain.find(eventName)
    return !!node
  }

  public getEventResult = (event: string) => {
    return this.eventResultMap[event]
  }

  public execPlan = () => {
    if (this.isAsync) {
      return this.execAsyncPlan()
    }
    const chain = this.eventChain
    let eventNode = chain.getHead().next
    let pervEventName: string | undefined = undefined
    let prevEventRes: any[] = []
    while (eventNode) {
      const eventName = eventNode.key
      const curEventRes = this.eventsEmitt.emit(eventName, {
        pervEventName,
        prevEventRes,
      })
      pervEventName = eventName
      prevEventRes = curEventRes
      this.eventResultMap[eventName] = curEventRes
      eventNode = eventNode.next
    }
    this.eventChain.getHead().next = null
    return this.eventResultMap
  }

  public execAsyncPlan = () => {
    const chain = this.eventChain
    let eventNode = chain.getHead().next
    let pervEventName: string | undefined = undefined
    while (eventNode) {
      const eventName = eventNode.key
      this.eventsEmitt.emit(eventName, pervEventName)
      pervEventName = eventName
      eventNode = eventNode.next
    }
    const alock = new AsyncLock()
    this.eventQueue
      .add((prevRes: any) => {
        this.eventResultMap[pervEventName]?.push?.(prevRes)
        this.eventChain.getHead().next = null
        alock.unLock(prevRes)
      })
      .trigger()

    return alock.getLock()
  }
}

export default Plan
