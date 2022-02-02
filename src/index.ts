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
      throw new Error('before and after can not exist at the same')
    }
    this.planInfoMap[name] = { ...info, weight }
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

  private emitEvent = () => {
    const chain = this.eventChain
    let eventNode = chain.getHead().next
    while (eventNode) {
      const eventName = eventNode.key
      this.eventsEmitt.emit(eventName)
      eventNode = eventNode.next
    }
  }

  public isPlanEvent = (eventName: string) => {
    const node = this.eventChain.find(eventName)
    return !!node
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
