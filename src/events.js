import { isUndefined } from './utils'

const EventEntry = 'keebweeb-entry',
      EventProgress = 'keepweeb-progress',
      EventNext = 'keebweeb-next',
      EventReset = 'keebweeb-reset',
      EventTypingStop = 'keebweeb-typing-stop',
      EventComplete = 'keebweeb-complete'


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
  EventComplete,
  EventEntry,
  EventProgress,
  EventNext,
  EventReset,
  EventTypingStop,

  emit,
  listen
}
