const EventEntry = 'keebweeb-entry',
      EventProgress = 'keepweeb-progress',
      EventStop = 'keebweeb-stop',
      EventReset = 'keebweeb-reset',
      EventTypingStop = 'keebweeb-typing-stop'

function emit(eventName, data) {
  document.dispatchEvent(
    typeof data === 'undefined'
      ? new Event(eventName)
      : new CustomEvent(eventName, {detail: data}))
}

function listen(eventName, handler) {
  document.addEventListener(
    eventName,
    e => typeof e.detail === 'undefined' ? handler(): handler(e.detail))
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
