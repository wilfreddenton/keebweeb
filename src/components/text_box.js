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
import { LinkedList } from './linked_list'

export default class TextBox extends LinkedList {
  constructor(element) {
    super(document.createElement('div'), {
      parentHeight: null,
      shift: 0,
      isFocused: false
    })
    this._parent = element
    this._parent.appendChild(this._element)
    this._text = ""
    this._index = 0
    this._cursor = null
    this._cursorInterval = null
    this._cursorIntervalParams = [() => this._cursor.classList().toggle('cursor-hide'), 530]
    this._lineHeightRem = 3
    this._textBoxSize = 3
    this._fontSize = getRootFontSize()

    this._setupListeners()
  }

  _setCursor(cc, after) {
    after = isUndefined(after) ? false : after
    after ? cc.setCursorAfter() : cc.setCursorBefore()
    if (cc.prev() !== null) cc.prev().unsetCursor()
    if (cc.next() !== null) cc.next().unsetCursor()
    this._cursor = cc
  }

  _reset(text) {
    this._text = text.trim()
    this._index = 0
    this.setState({
      parentHeight: null,
      shift: 0
    })

    this._render()
    this._focus()
  }

  _render() {
    let node = this.head()
    for (let i = 0; i < this._text.length; i += 1) {
      const c = this._text[i]
      if (node === null) {
        const cc = new CC(c)
        this.push(cc)
        node = null
      } else {
        node.setChar(c)
        node = node.next()
      }
    }
    this.chop(node)

    this._setCursor(this.head())
  }

  _complete() {
    this._blur()
    const parentHeight = this._lineHeightRem * this._textBoxSize
    const height = this._lineHeightRem * this._numLines()
    this.setState({
      parentHeight: Math.max(parentHeight, height),
      shift: 0
    })
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
    if (this.state.parentHeight !== null) {
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
    if (this._cursor === this.head()) return
    const cc = this._cursor.prev()
    if (cc.isCorrect()) {
      this._index -= 1
      cc.revert()
      this._setCursor(cc)
    } else {
      this.removeNode(cc)
      emit(EventEntry, {entryDelta: 0, errorDelta: -1})
    }
    return false
  }

  _characterHandler(c) {
    const cc = this._cursor
    if (cc.setEntry(c)) {
      this._index += 1
      emit(EventEntry, {entryDelta: 1, errorDelta: 0})
      if (cc === this.tail()) {
        this._setCursor(cc, true)
        return true
      } else {
        this._setCursor(cc.next())
        return false
      }
    } else {
      const errorCC = new CC(c, {isIncorrect: true})
      this.insertNodeBefore(cc, errorCC)
      emit(EventEntry, {entryDelta: 1, errorDelta: 1})
      return false
    }
  }

  _input(e, h) {
    if (!this._isFocused()) return
    if (this._index === this._text.length) return
    e.preventDefault()
    e.stopPropagation()

    this._resetCursorInterval()
    emit(EventTypingStart)

    const isComplete = h(e.key)
    if (isComplete) {
      this._complete()
    } else {
      this._scrollCursorIntoView()
    }

    emit(EventProgress, {index: this._index, length: this._text.length})
  }

  _numLines() {
    return Math.floor(this._element.offsetHeight / this._lineHeightPx())
  }

  _scrollCursorIntoView() {
    const cursorLine = Math.floor(this._cursor.offsetTop() / this._lineHeightPx()) + 1
    const shift = Math.floor(Math.min(
      Math.max(0, cursorLine - (Math.floor(this._textBoxSize / 2) + 1)),
      Math.max(0, this._numLines() - this._textBoxSize)
    ))
    this.setState({
      shift
    })
  }

  _isFocused() {
    return this.state.isFocused
  }

  _resetCursorInterval() {
    clearInterval(this._cursorInterval)
    this._cursorInterval = setInterval(...this._cursorIntervalParams)
  }

  _focus() {
    this.setState({isFocused: true})
    this._resetCursorInterval()
  }

  _blur() {
    this.setState({isFocused: false})
    clearInterval(this._cursorInterval)
    emit(EventTypingStop)
  }

  render(prevState) {
    const isInitial = isUndefined(prevState)
    if (!isInitial && prevState.isFocused !== this.state.isFocused) {
      if (this.state.isFocused) {
        this._cursor.show()
      } else {
        this._cursor.hide()
      }
    }

    if (!isInitial && prevState.parentHeight !== this.state.parentHeight) {
      if (this.state.parentHeight === null) {
        this._parent.style.height = ''
      } else {
        this._parent.style.height = `${this.state.parentHeight}rem`
      }
    }

    if (!isInitial && prevState.shift !== this.state.shift) {
      this.style().transform = `translateY(${-this.state.shift*this._lineHeightRem}rem)`
    }
  }
}
