import {
  EventTypingStart,
  EventTypingStop,
  emit,
  listen
} from './events.js'

function isUndefined(v) {
  return typeof v === 'undefined'
}

function debounce(f, ms) {
  let timeout = null
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      f(...args)
    }, ms)
  }
}

function getRootFontSize() {
  return parseInt(window.getComputedStyle(document.documentElement).fontSize.match(/\d+/)[0])
}

class Element {
  constructor(element) {
    this._element = element
  }

  getInnerHTML() {
    return this._element.innerHTML
  }

  setInnerHTML(html) {
    this._element.innerHTML = html
  }

  setValue(v) {
    this._element.value = v
  }

  style() {
    return this._element.style
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

  adjacentSiblings() {
    return [this._element.previousSibling, this._element.nextSibling]
  }

  appendChild(child) {
    if (child instanceof Element) child = child._element
    this._element.appendChild(child)
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

export { debounce, getRootFontSize, isUndefined, Element, Fade }
