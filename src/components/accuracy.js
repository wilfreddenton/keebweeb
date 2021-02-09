import {
  EventEntry,
  EventReset,
  listen
} from '../events'

import Component from './component'

export default class Accuracy extends Component {
  static initialState = { numEntries: 0, numErrors: 0 }

  constructor(element) {
    super(element, Accuracy.initialState)

    this._accuracy = 100

    this._setupListeners()
  }

  _setupListeners() {
    listen(EventEntry, ({ entryDelta, errorDelta }) => {
      this.setState({
        numEntries: this.state.numEntries + entryDelta,
        numErrors: this.state.numErrors + Math.max(0, errorDelta)
      })
    })
    listen(EventReset, () => {
      this.setState(Accuracy.initialState)
    })
  }

  render() {
    this._accuracy = this.state.numEntries === 0
      ? 1
      : (this.state.numEntries - this.state.numErrors) / this.state.numEntries
    this.setInnerHTML(`Accuracy: ${Math.floor(this._accuracy * 100)}%`)
  }
}
