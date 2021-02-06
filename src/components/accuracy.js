import {
  EventEntry,
  EventReset,
  listen
} from '../events'

import Fade from './fade'

export default class Accuracy extends Fade {
  constructor(element) {
    super(element)

    this.stateChangeHandlers = [this._render]
    this._reset()
    this._setupListeners()
  }

  _setupListeners() {
    listen(EventEntry, ({ entryDelta, errorDelta }) => {
      this.setState({
        numEntries: this.state.numEntries + entryDelta,
        numErrors: this.state.numErrors + Math.max(0, errorDelta)
      })
    })
    listen(EventReset, this._reset.bind(this))
  }

  _reset() {
    this.setState({
      numEntries: 0,
      numErrors: 0
    })
  }

  _render = () => {
    const accuracy = this.state.numEntries === 0
      ? 1
      : (this.state.numEntries - this.state.numErrors) / this.state.numEntries
    this.setInnerHTML(`Accuracy: ${Math.floor(accuracy * 100)}%`)
  }
}
