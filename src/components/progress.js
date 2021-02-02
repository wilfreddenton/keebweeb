import { Fade } from '../utils'
import { EventProgress, EventReset, listen } from '../events'

export default class Progress extends Fade {
  constructor(element) {
    super(element)

    this._reset()
    this._setupListeners()
  }

  _setupListeners() {
    listen(EventProgress, ({index, length}) => {
      this._progress = Math.floor((index / length) * 100)
      this._render()
    })
    listen(EventReset, () => {
      this._reset()
    })
  }

  _reset() {
    this._progress = 0
    this._render()
  }

  _render() {
    this.setInnerHTML(`Progress: ${this._progress}%`)
  }
}
