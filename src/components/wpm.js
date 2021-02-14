import { EntryType, isUndefined } from '../utils'

import Component from './component'

export default class WPM extends Component {
  static initialState = {wpm: 0}

  constructor(element) {
    super(element, WPM.initialState)

    this._timeStart = null
    this._numEntries = 0
    this._numErrors = 0
  }

  entry(entryType, time) {
    switch (entryType) {
      case EntryType.correct:
        this._numEntries += 1
        break
      case EntryType.incorrect:
        this._numEntries += 1
        this._numErrors += 1
        break
      case EntryType.fix:
        this._numEntries -= 1
        this._numErrors -= 1
        break
    }

    let wpm = 0
    if (this._timeStart === null) {
      this._timeStart = time
    } else {
      const numMins = (time - this._timeStart) / (1000 * 60)
      const grossWPM = Math.round((this._numEntries / 5) / numMins)
      wpm = Math.max(0, Math.round(grossWPM - this._numErrors / numMins))
    }
    this.setState({wpm})
    return wpm
  }

  reset() {
    this._timeStart = null
    this._numEntries = 0
    this._numErrors = 0
    this.setState(WPM.initialState)
  }

  render(prevState) {
    if (isUndefined(prevState) || prevState.wpm !== this.state.wpm) {
      this.setInnerHTML(`WPM: ${Math.round(this.state.wpm)}`)
    }
  }
}
