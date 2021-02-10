import { isUndefined } from './utils'

const EventEntry = 'keebweeb-entry',
      EventProgress = 'keepweeb-progress',
      EventStop = 'keebweeb-stop',
      EventReset = 'keebweeb-reset',
      EventTypingStop = 'keebweeb-typing-stop'

function emit(eventName, data) {
  document.dispatchEvent(
    isUndefined(data)
      ? new Event(eventName)
      : new CustomEvent(eventName, {detail: data}))
}

function listen(eventName, handler) {
  document.addEventListener(
    eventName,
    e => isUndefined(e.detail) ? handler(): handler(e.detail))
}

export {
  EventEntry,
  EventProgress,
  EventStop,
  EventReset,
  EventTypingStop,

  emit,
  listen
}
