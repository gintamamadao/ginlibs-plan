import { Chain } from 'ginlibs-chain'
import { Events } from 'ginlibs-events'
import { isFunc } from 'ginlibs-type-check'
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
    const anchorNode = this.eventChain.findFuncNode((nodeVal: string) => {
      const itEventInfo = this.planInfoMap[nodeVal]
      const { weight: itWeight = 0, before, after } = itEventInfo
      return !before && !after && itWeight >= weight
    })
    if (!anchorNode) {
      this.eventChain.unshift(name)
      return
    }

    let afterEventNode = anchorNode.next
    while (afterEventNode) {
      const eventInfo = this.planInfoMap[afterEventNode.key]
      if (eventInfo.after !== anchorNode.key) {
        this.eventChain.insertBefore(afterEventNode.key, name)
        return
      }
      afterEventNode = afterEventNode.next
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
    let beforeChildAncNode = this.eventChain.findFuncNode((nodeVal: string) => {
      const itEventInfo = this.planInfoMap[nodeVal]
      const { before } = itEventInfo
      return before === anchorNode.key
    })
    if (!beforeChildAncNode) {
      this.eventChain.insertBefore(anchorNode.key, name)
      return
    }
    let afterAncInfo: any = this.planInfoMap[beforeChildAncNode.key]
    while (
      beforeChildAncNode &&
      afterAncInfo &&
      afterAncInfo.before === anchorNode.key &&
      (afterAncInfo.weight || 0) >= weight
    ) {
      beforeChildAncNode = beforeChildAncNode.next
      afterAncInfo = beforeChildAncNode
        ? this.planInfoMap[beforeChildAncNode.key]
        : null
    }

    if (beforeChildAncNode) {
      this.eventChain.insertBefore(beforeChildAncNode.key, name)
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

  public execPlan = () => {
    const chain = this.eventChain
    let eventNode = chain.getHead().next
    while (eventNode) {
      const eventName = eventNode.key
      this.eventsEmitt.emit(eventName)
      eventNode = eventNode.next
    }
    if (this.isAsync) {
      this.eventQueue.trigger()
    }
  }
}

export default Plan
