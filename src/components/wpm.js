import {
  EventEntry,
  EventReset,
  listen
} from '../events'

import Fade from './fade'

export default class WPM extends Fade {
  constructor(element, intervalMS) {
    super(element)

    this._intervalMS = intervalMS || 1000

    this._reset()
    this._setupListeners()
  }

  _setupListeners() {
    listen(EventEntry, ({entryDelta, errorDelta}) => {
      if (this._startTime === null) this._startTime = new Date().getTime()
      this._numEntries += entryDelta
      this._numErrors += errorDelta

      this._updateStats()
      this._render()
    })
    listen(EventReset, this._reset.bind(this))
  }

  _reset() {
    this._numEntries = 0
    this._timeLast = 0
    this._numErrors = 0
    this._rawWPM = 0
    this._netWPM = 0
    this._startTime = null

    this._render()
  }

  _render() {
    this.setInnerHTML(`${Math.round(this._netWPM)} WPM (raw: ${this._rawWPM})`)
  }

  _updateStats() {
    let _timeLast = this._timeLast
    const time = new Date().getTime()
    this._timeLast = time
    if (_timeLast === 0) return

    const timeBetween = time - _timeLast
    this._rawWPM = Math.round(((60 * 1000) / timeBetween) / 5)
    const numMins = (time - this._startTime) / (1000 * 60)
    const grossWPM = Math.round((this._numEntries / 5) / numMins)
    this._netWPM = Math.max(0, Math.round(grossWPM - this._numErrors / numMins))
  }
}
