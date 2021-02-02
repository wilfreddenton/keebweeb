import {
  EventTypingStart,
  EventTypingStop,
  emit,
  listen
} from './events.js'

function isUndefined(v) {
  return typeof v === 'undefined'
}

class Element {
  constructor(element) {
    this._element = element
  }

  element() {
    return this._element
  }

  getInnerHTML() {
    return this._element.innerHTML
  }

  setInnerHTML(html) {
    this._element.innerHTML = html
  }

  classList() {
    return this._element.classList
  }

  remove() {
    this._element.remove()
  }

  insertBefore(element) {
    this._element.parentNode.insertBefore(element, this._element)
  }

  insertAfter(element) {
    this._element.parentNode.insertBefore(element, this._element.nextSibling)
  }

  addEventListener(event, f) {
    return this._element.addEventListener(event, f)
  }
}

class Fade extends Element {
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

export { isUndefined, Element, Fade }
