import { EntryType, isUndefined } from '../utils'

import Component from './component'

export default class Accuracy extends Component {
  static initialState = { accuracy: 100 }

  constructor(element) {
    super(element, Accuracy.initialState, {
      _numEntries: 0,
      _numErrors: 0
    })
  }

  entry(entryType) {
    switch (entryType) {
      case EntryType.correct:
        this._numEntries += 1
        break
      case EntryType.incorrect:
        this._numErrors += 1
        break
    }

    const accuracy = this._numEntries > 0
      ? Math.max(0, Math.floor(((this._numEntries - this._numErrors) / this._numEntries) * 100))
      : 0
    this.setState({accuracy})
    return accuracy
  }

  reset() {
    super.reset()
    this.setState(Accuracy.initialState)
  }

  render(prevState) {
    if (isUndefined(prevState) || prevState.accuracy !== this.state.accuracy) {
      this.setInnerHTML(`Accuracy: ${this.state.accuracy}%`)
    }
  }
}
