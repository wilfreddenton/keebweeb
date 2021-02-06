import {
  EventEntry,
  EventReset,
  listen
} from '../events'

import { isUndefined } from '../utils'

import Fade from './fade'

export default class WPM extends Fade {
  constructor(element) {
    super(element)

    this.stateChangeHandlers = [this._render]
    this._reset()
    this._setupListeners()
  }

  _setupListeners() {
    listen(EventEntry, ({entryDelta, errorDelta}) => {
      const time =  new Date().getTime()
      this.setState({
        numEntries: this.state.numEntries + entryDelta,
        numErrors: this.state.numErrors + errorDelta,
        timeStart: this.state.timeStart === null ? time : this.state.timeStart,
        time: time
      })
    })
    listen(EventReset, this._reset.bind(this))
  }

  _reset() {
    this.setState({
      numEntries: 0,
      numErrors: 0,
      timeStart: null,
      time: null
    })
  }

  _render = (prevState) => {
    let rawWPM = 0
    let netWPM = 0
    if ([
      !isUndefined(prevState.time),
      this.state.time !== null,
      prevState.time !== null
    ].every(b => b)) {
      const timeBetween = this.state.time - prevState.time
      rawWPM = Math.round(((60 * 1000) / timeBetween) / 5)
      const numMins = (this.state.time - this.state.timeStart) / (1000 * 60)
      const grossWPM = Math.round((this.state.numEntries / 5) / numMins)
      netWPM = Math.max(0, Math.round(grossWPM - this.state.numErrors / numMins))
    }
    this.setInnerHTML(`${Math.round(netWPM)} WPM (raw: ${rawWPM})`)
  }
}
