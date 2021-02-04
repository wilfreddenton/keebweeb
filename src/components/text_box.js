import {
  EventEntry,
  EventProgress,
  EventReset,
  EventStop,
  EventTypingStart,
  EventTypingStop,
  emit,
  listen
} from '../events'

import { debounce, getRootFontSize, isUndefined } from '../utils'

import CC from './cc'
import Component from './component'

export default class TextBox extends Component {
  constructor(element) {
    super(document.createElement('div'))
    this._parent = element
    this._parent.appendChild(this._element)
    this._text = ""
    this._ccs = []
    this._cursor = null
    this._cursorInterval = null
    this._cursorIntervalParams = [() => this._cursor.classList().toggle('cursor-hide'), 530]
    this._lineHeightRem = 3
    this._windowSize = 3
    this._isComplete = false

    this._setupListeners()
  }

  _setCursor(cc, after) {
    after = isUndefined(after) ? false : after
    after ? cc.setCursorAfter() : cc.setCursorBefore()
    this._cursor = cc
  }

  _reset(text) {
    this._text = text.trim()
    this._index = 0

    this._render()
    this._resizeHandler()
    this._focus()
  }

  _render() {
    this._ccs.splice(this._text.length).forEach(cc => cc.remove())

    for (let i = 0; i < this._text.length; i += 1) {
      const c = this._text[i]
      if (i < this._ccs.length) {
        this._ccs[i].setChar(c)
      } else {
        const cc = new CC(c)
        this.appendChild(cc)
        this._ccs.push(cc)
      }
    }

    this._setCursor(this._ccs[0])
  }

  _complete() {
    this._blur()
    const parentHeight = this._lineHeightPx() * 3
    const height = this._element.offsetHeight
    const targetHeight = Math.max(parentHeight, height)
    this._parent.style.height = `${targetHeight}px`
    this.style().transform = `translateY(0rem)`
  }

  _lineHeightPx() {
    return this._fontSize * this._lineHeightRem
  }

  _setupListeners() {
    window.addEventListener('resize', debounce(this._resizeHandler.bind(this), 100))
    document.addEventListener('click', this._blur.bind(this))
    this._parent.addEventListener('click', e => {
      e.stopPropagation()
      this._focus()
    })
    document.addEventListener('keydown', e => {
      if ([e.altKey, e.ctrlKey, e.metaKey].some(b => b)) return
      this._entryHandler(e)
    })
    listen(EventStop, this._blur.bind(this))
    listen(EventReset, ({text}) => {
      this._reset(text)
    })
  }

  _resizeHandler() {
    this._fontSize = getRootFontSize()
    if (this._isComplete) {
      this._complete()
    } else {
      this._scrollCursorIntoView()
    }
  }

  _entryHandler(e) {
    switch(e.key) {
    case 'Tab':
      e.preventDefault()
      break
    case 'Escape':
      this._blur()
      break
    case 'Enter':
      this._focus()
      break
    case 'Backspace':
      this._input(e, this._backspaceHandler.bind(this))
      break
    case 'n':
      if (!this._isFocused()) {
        emit(EventStop, {wait: false})
        break
      }
    case 'r':
      if (!this._isFocused()) {
        emit(EventReset, {text: this._text})
        break
      }
    default:
      if (!/^.$/.test(e.key)) break
      this._input(e, this._characterHandler.bind(this))
    }
  }

  _backspaceHandler() {
    if (this._index < 1) return
    this._index -= 1
    const cc = this._ccs[this._index]
    if (cc.isCorrect()) {
      cc.revert()
      this._setCursor(cc)
    } else {
      this._ccs.splice(this._index, 1)
      cc.remove()
      emit(EventEntry, {entryDelta: 0, errorDelta: -1})
    }
    return false
  }

  _characterHandler(c) {
    const cc = this._ccs[this._index]
    if (cc.setEntry(c)) {
      emit(EventEntry, {entryDelta: 1, errorDelta: 0})
    } else {
      const errorCC = new CC(c, cc, false)
      this._ccs.splice(this._index, 0, errorCC)
      emit(EventEntry, {entryDelta: 1, errorDelta: 1})
    }

    this._index += 1
    if (this._index < this._ccs.length) {
      this._setCursor(this._ccs[this._index])
      return false
    } else {
      this._setCursor(cc, true)
      if (cc.isCorrect() && this._index === this._ccs.length) return true
    }
  }

  _input(e, h) {
    if (!this._isFocused()) return
    if (this._index >= this._ccs.length) return
    e.preventDefault()
    e.stopPropagation()

    this._resetCursorInterval()
    emit(EventTypingStart)

    this._isComplete = h(e.key)

    emit(EventProgress, {index: this._index, length: this._ccs.length})
    if (this._isComplete) {
      this._complete()
    } else {
      this._scrollCursorIntoView()
    }
  }

  _scrollCursorIntoView() {
    const cursorLine = Math.floor(this._cursor.offsetTop() / this._lineHeightPx()) + 1
    const numLines = this._element.offsetHeight / this._lineHeightPx()
    const rems = Math.min(
      Math.max(0, cursorLine - (Math.floor(this._windowSize / 2) + 1)),
      Math.max(0, numLines - this._windowSize)
    )
    this.style().transform = `translateY(${-rems*3}rem)`
  }

  _isFocused() {
    return this.classList().contains('focused')
  }

  _resetCursorInterval() {
    this._cursor.classList().remove('cursor-hide')
    clearInterval(this._cursorInterval)
    this._cursorInterval = setInterval(...this._cursorIntervalParams)
  }

  _focus() {
    if (!this._isFocused()) this.classList().add('focused')
    this._resetCursorInterval()
  }

  _blur() {
    this.classList().remove('focused')
    clearInterval(this._cursorInterval)
    this._cursor.classList().add('cursor-hide')
    emit(EventTypingStop)
  }
}
