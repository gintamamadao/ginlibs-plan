import Chain from 'ginlibs-chain'
import Events from 'ginlibs-events'

export interface EventPlanInfo {
  name: string
  handle: AnyFunction
  weight?: number
  before?: string
  after?: string
}
class Plan {
  private eventChain: Chain
  private eventsEmitt: Events
  private planInfoMap: Record<string, EventPlanInfo> = {}

  constructor(chain?: Chain, events?: Events) {
    this.eventChain = chain || new Chain()
    this.eventsEmitt = events || new Events()
  }

  public addToPlan(info: EventPlanInfo) {
    const { name, handle, weight = 0, before, after } = info
    if (before && after) {
      console.error('before and after can not exist at the same')
      return
    }
    this.planInfoMap[name] = info
    this.eventsEmitt.on(name, handle)
    const eventNode = this.eventChain.find(name)
    if (eventNode) {
      return
    }
    if (!before && !after) {
      this.addByWeight(name, weight)
      return
    }
    if (before) {
      this.addByBefore(name, before, weight)
      return
    }
    if (after) {
      this.addByAfter(name, after, weight)
      return
    }
  }

  private addByWeight(name: string, weight: number) {
    const anchorNode = this.eventChain.find((nodeVal: string) => {
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
      const eventInfo = this.planInfoMap[afterEventNode.value]
      if (eventInfo.after !== anchorNode.value) {
        this.eventChain.insertBefore(name, afterEventNode.value)
        return
      }
      afterEventNode = afterEventNode.next
    }
    this.eventChain.push(name)
    return
  }

  private addByBefore(name: string, before: string, weight = 0) {
    const anchorNode = this.eventChain.find(before)
    if (!anchorNode) {
      console.error('before event do not exist')
      return
    }
    let beforeChildAncNode = this.eventChain.find((nodeVal: string) => {
      const itEventInfo = this.planInfoMap[nodeVal]
      const { before } = itEventInfo
      return before === anchorNode.value
    })
    if (!beforeChildAncNode) {
      this.eventChain.insertBefore(name, anchorNode.value)
      return
    }
    let afterAncInfo: any = this.planInfoMap[beforeChildAncNode.value]
    while (
      beforeChildAncNode &&
      afterAncInfo &&
      afterAncInfo.before === anchorNode.value &&
      (afterAncInfo.weight || 0) >= weight
    ) {
      beforeChildAncNode = beforeChildAncNode.next
      afterAncInfo = beforeChildAncNode
        ? this.planInfoMap[beforeChildAncNode.value]
        : null
    }

    if (beforeChildAncNode) {
      this.eventChain.insertBefore(name, beforeChildAncNode.value)
    }
  }

  private addByAfter(name: string, after: string, weight = 0) {
    const anchorNode = this.eventChain.find(after)
    if (!anchorNode) {
      console.error('after event do not exist')
      return
    }
    let afterChildAncNode = this.eventChain.find((nodeVal: string) => {
      const itEventInfo = this.planInfoMap[nodeVal]
      const { after } = itEventInfo
      return after === anchorNode.value
    })
    if (!afterChildAncNode) {
      this.eventChain.insertAfter(name, anchorNode.value)
      return
    }
    let afterAncInfo: any = this.planInfoMap[afterChildAncNode.value]
    while (
      afterChildAncNode &&
      afterAncInfo &&
      afterAncInfo.after === anchorNode.value &&
      (afterAncInfo.weight || 0) >= weight
    ) {
      afterChildAncNode = afterChildAncNode.next
      afterAncInfo = afterChildAncNode
        ? this.planInfoMap[afterChildAncNode.value]
        : null
    }

    if (afterChildAncNode) {
      this.eventChain.insertBefore(name, afterChildAncNode.value)
    } else {
      this.eventChain.push(name)
    }
  }

  public getPlanInfo() {
    const plan = this.getPlan()
    return plan.map((name) => {
      return this.planInfoMap[name]
    })
  }

  public getPlan() {
    return this.eventChain.getNodeValues()
  }

  public clone() {
    return new Plan(this.eventChain.clone(), this.eventsEmitt)
  }

  public reGeneratePlan() {
    this.eventChain = new Chain()
    this.eventsEmitt = new Events()
    for (const key of Object.keys(this.planInfoMap)) {
      this.addToPlan(this.planInfoMap[key])
    }
  }

  public async execPlan() {
    const chain = this.eventChain
    let eventNode = chain.getFirstNode()
    while (eventNode) {
      const eventName = eventNode.value
      await this.eventsEmitt.emit(eventName)
      eventNode = eventNode.next
    }
  }
}

export default Plan
