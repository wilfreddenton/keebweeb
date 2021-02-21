import { EntryType, isUndefined } from '../utils'

import Component from './component'

export default class WPM extends Component {
  static initialState = {wpm: 0}

  constructor(element) {
    super(element, WPM.initialState, {
      _timeStart: null,
      _numEntries: 0,
      _numErrors: 0
    })
  }

  entry(entryType, time) {
    switch (entryType) {
      case EntryType.correct:
        // if the first entry is correct don't count it
        // counting it would skew the WPM result on the
        // second entry. It would look like the user
        // typed 2 entries in the time it took them to
        // type 1.
        if (this._timeStart !== null) this._numEntries += 1
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
    if (this._timeStart === null) {
      this._timeStart = time
    } else {
      wpm = Math.max(0, Math.round(((this._numEntries - this._numErrors) * 12000) / (time - this._timeStart)))
    }
    this.setState({wpm})
    return wpm
  }

  reset() {
    super.reset()
    this.setState(WPM.initialState)
  }

  render(prevState) {
    if (isUndefined(prevState) || prevState.wpm !== this.state.wpm) {
      this.setInnerHTML(`WPM: ${this.state.wpm}`)
    }
  }
}
