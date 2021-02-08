import {
  EventEntry,
  EventTypingStop,
  emit,
  listen
} from './events'

export default class Fade {
  constructor(intervalMS) {
    this._timeout = null

    listen(EventEntry, () => {
      clearTimeout(this._timeout)
      document.querySelectorAll('.fade').forEach(e => {
        e.classList.add('typing')
      })
      this._timeout = setTimeout(() => emit(EventTypingStop), intervalMS)
    })
    listen(EventTypingStop, () => {
      clearTimeout(this._timeout)
      document.querySelectorAll('.fade').forEach(e => e.classList.remove('typing'))
    })
  }
}
