import { Fade } from '../utils'
import { EventEntry, EventReset, listen } from '../events'

export default class Accuracy extends Fade {
  constructor(element) {
    super(element)

    this._reset()
    this._setupListeners()
  }

  _setupListeners() {
    listen(EventEntry, ({entryDelta, errorDelta}) => {
      this._numEntries += entryDelta
      this._numErrors += errorDelta > -1 ? errorDelta : 0
      this._render()
    })
    listen(EventReset, this._reset.bind(this))
  }

  _reset() {
    this._numEntries = 0
    this._numErrors = 0

    this._render()
  }

  _render() {
    this.setInnerHTML(`Accuracy: ${Math.floor(this.accuracy() * 100)}%`)
  }

  accuracy() {
    if (this._numEntries === 0) return 1
    return (this._numEntries - this._numErrors) / this._numEntries
  }
}
