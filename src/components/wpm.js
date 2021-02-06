import {
  EventEntry,
  EventReset,
  listen
} from '../events'

import { isUndefined } from '../utils'

import Component from './component'

export default class WPM extends Component {
  static initialState = {
    numEntries: 0,
    numErrors: 0,
    timeStart: null,
    time: null
  }

  constructor(element) {
    super(element, WPM.initialState)
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
    listen(EventReset, () => {
      this.setState(WPM.initialState)
    })
  }

  render(prevState) {
    let rawWPM = 0
    let netWPM = 0
    if (!isUndefined(prevState) && this.state.time !== null && prevState.time !== null) {
      const timeBetween = this.state.time - prevState.time
      rawWPM = Math.round(((60 * 1000) / timeBetween) / 5)
      const numMins = (this.state.time - this.state.timeStart) / (1000 * 60)
      const grossWPM = Math.round((this.state.numEntries / 5) / numMins)
      netWPM = Math.max(0, Math.round(grossWPM - this.state.numErrors / numMins))
    }
    this.setInnerHTML(`${Math.round(netWPM)} WPM (raw: ${rawWPM})`)
  }
}
