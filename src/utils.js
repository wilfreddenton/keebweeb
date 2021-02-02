import {
  EventTypingStart,
  EventTypingStop,
  emit,
  listen
} from './events.js'

class Fade {
  constructor(element) {
    this._element = element
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

export { Fade }
