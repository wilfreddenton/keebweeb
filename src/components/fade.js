import {
  EventTypingStart,
  EventTypingStop,
  emit,
  listen
} from '../events'

import Component from './component'

export default class Fade extends Component {
  constructor(element) {
    super(element)
    this._timeout = null

    this._setup()
  }

  _setup() {
    this._element.classList.add('fade')
    listen(EventTypingStart, () => {
      clearTimeout(this._timeout)
      this._element.classList.add('typing')
      this._timeout = setTimeout(() => {
        emit(EventTypingStop)
      }, 2000)
    })
    listen(EventTypingStop, () => {
      clearTimeout(this._timeout)
      this._element.classList.remove('typing')
    })
  }
}
