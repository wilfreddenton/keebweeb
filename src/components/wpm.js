import { EntryType, isUndefined } from '../utils'

import Component from './component'

const toSeconds = 1000
const toMins = toSeconds * 60

export default class WPM extends Component {
  static initialState = {raw: 0, wpm: 0}

  constructor(element) {
    super(element, WPM.initialState, {
      _timeStart: null,
      _timePrev: null,
      _timeBetweenSum: 0,
      _numCorrect: 0,
      _numEntries: 0,
      _numErrors: 0
    })
  }

  entry(entryType, time) {
    switch (entryType) {
      case EntryType.correct:
        this._numCorrect += 1
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
      case EntryType.revert:
        this._numEntries -= 1
    }

    let wpm = this.state.wpm
    let raw = this.state.raw
    if (this._timeStart === null) {
      this._timeStart = time
      this._timePrev = time
    } else {
      if (entryType === EntryType.correct) {
        this._timeBetweenSum += time - this._timePrev
        this._timePrev = time
      }
      if ((this._numCorrect - 1) % 5 === 0) {
        raw = Math.round(1 / (this._timeBetweenSum / toMins))
        this.setState({raw})
        this._timeBetweenSum = 0
      }

      const numMins = (time - this._timeStart) / toMins
      const grossWPM = Math.round(((this._numEntries - 1) / 5) / numMins)
      wpm = Math.max(0, Math.round(grossWPM - this._numErrors / numMins))
    }
    this.setState({wpm})
    return { wpm, raw }
  }

  reset() {
    super.reset()
    this.setState(WPM.initialState)
  }

  render(prevState) {
    if (isUndefined(prevState) || prevState.wpm !== this.state.wpm) {
      this.setInnerHTML(`WPM: ${this.state.wpm} (raw: ${this.state.raw})`)
    }
  }
}
