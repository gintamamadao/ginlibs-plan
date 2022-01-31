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

  constructor(context: any = {}, isAsync = false) {
    this.eventChain = new Chain()
    this.eventsEmitt = new Events(context)
    this.eventQueue = new EventQueue()
    this.isAsync = isAsync
  }

  public addToPlan = (info: EventPlanInfo) => {
    const { name, handle, weight = 0, before, after } = info
    if (before && after) {
      console.error('before and after can not exist at the same')
      return
    }
    this.planInfoMap[name] = info
    if (this.isAsync) {
      this.eventsEmitt.on(name, (...args: any[]) => {
        this.eventQueue.add(() => {
          return isFunc(handle) && handle(...args)
        })
      })
    } else {
      this.eventsEmitt.on(name, handle)
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

  private addByWeight = (name: string, weight: number) => {
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
      const eventKeys = this.eventChain.getNodeKeys()
      const lighterNodeKey = heavierNextEventNode.key
      let anchorKey = lighterNodeKey
      for (const key of eventKeys) {
        const eventInfo = this.planInfoMap[key]
        if (eventInfo.before === lighterNodeKey || key === lighterNodeKey) {
          anchorKey = key
          break
        }
      }
      this.eventChain.insertBefore(anchorKey, name)
      return
    }

    this.eventChain.push(name)
    return
  }

  private addByBefore = (before: string, name: string, weight = 0) => {
    const anchorNode = this.eventChain.find(before)
    if (!anchorNode) {
      console.error('before event do not exist')
      return
    }
    let beforeAncNode = this.eventChain.findFuncNode((nodeVal: string) => {
      const itEventInfo = this.planInfoMap[nodeVal]
      const { before } = itEventInfo
      return before === anchorNode.key
    })
    if (!beforeAncNode) {
      this.eventChain.insertBefore(anchorNode.key, name)
      return
    }
    let afterAncInfo: any = this.planInfoMap[beforeAncNode.key]
    while (
      beforeAncNode &&
      afterAncInfo &&
      afterAncInfo.before === anchorNode.key &&
      (afterAncInfo.weight || 0) >= weight
    ) {
      beforeAncNode = beforeAncNode.next
      afterAncInfo = beforeAncNode ? this.planInfoMap[beforeAncNode.key] : null
    }

    if (beforeAncNode) {
      this.eventChain.insertBefore(beforeAncNode.key, name)
    }
  }

  private addByAfter = (after: string, name: string, weight = 0) => {
    const anchorNode = this.eventChain.find(after)
    if (!anchorNode) {
      console.error('after event do not exist')
      return
    }
    let afterChildAncNode = this.eventChain.findFuncNode((nodeVal: string) => {
      const itEventInfo = this.planInfoMap[nodeVal]
      const { after } = itEventInfo
      return after === anchorNode.key
    })
    if (!afterChildAncNode) {
      this.eventChain.insertAfter(anchorNode.key, name)
      return
    }
    let afterAncInfo: any = this.planInfoMap[afterChildAncNode.key]
    while (
      afterChildAncNode &&
      afterAncInfo &&
      afterAncInfo.after === anchorNode.key &&
      (afterAncInfo.weight || 0) >= weight
    ) {
      afterChildAncNode = afterChildAncNode.next
      afterAncInfo = afterChildAncNode
        ? this.planInfoMap[afterChildAncNode.key]
        : null
    }

    if (afterChildAncNode) {
      this.eventChain.insertBefore(afterChildAncNode.key, name)
    } else {
      this.eventChain.push(name)
    }
  }

  public getPlanInfo = () => {
    const plan = this.getPlan()
    return plan.map((name) => {
      return this.planInfoMap[name]
    })
  }

  public getPlan = () => {
    return this.eventChain.getNodeKeys()
  }

  private emitEvent = () => {
    const chain = this.eventChain
    let eventNode = chain.getHead().next
    while (eventNode) {
      const eventName = eventNode.key
      this.eventsEmitt.emit(eventName)
      eventNode = eventNode.next
    }
  }

  public execPlan = () => {
    this.emitEvent()
    if (this.isAsync) {
      this.eventQueue.trigger()
    }
  }

  public execAsyncPlan = async () => {
    this.emitEvent()
    const alock = new AsyncLock()
    this.eventQueue
      .add(() => {
        alock.unLock()
      })
      .trigger()

    await alock.getLock()
  }
}

export default Plan
