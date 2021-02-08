import {
  EventEntry,
  EventProgress,
  EventReset,
  EventStop,
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
      isFocused: false,
      isComplete: false,
      cursor: null,
      width: window.innerWidth
    })

    this._parent = element
    this._parent.appendChild(this._element)
    this._text = ""
    this._cursorInterval = null
    this._cursorIntervalParams = [() => this.state.cursor.toggle(), 530]
    this._fontSize = getRootFontSize()
    this._lineHeightRem = Math.floor(parseInt(window.getComputedStyle(this._parent).lineHeight.slice(0, -2)) / this._fontSize)
    this._textBoxSize = this._numLines(this._parent)

    this._setupListeners()
  }

  _reset(text) {
    this._text = text.trim()
    this._newLinkedList()
    this.setState({
      parentHeight: null,
      shift: 0,
      cursor: this.head(),
      isComplete: false
    })
    this._focus()
  }

  _newLinkedList() {
    let node = this.head()
    for (let i = 0; i < this._text.length; i += 1) {
      const c = this._text[i]
      if (node === null) {
        const cc = new CC(c)
        cc.setIndex(i)
        this.push(cc)
        node = null
      } else {
        node.setChar(c)
        node.setIndex(i)
        node = node.next()
      }
    }
    this.chop(node)
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
    window.addEventListener('resize', debounce(() => this.setState({width: window.innerWidth}), 100))
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
      if (!this.state.isFocused) {
        emit(EventStop, {wait: false})
        break
      }
    case 'r':
      if (!this.state.isFocused) {
        emit(EventReset, {text: this._text})
        break
      }
    default:
      if (!/^.$/.test(e.key)) break
      this._input(e, this._characterHandler.bind(this))
    }
  }

  _backspaceHandler() {
    if (this.state.cursor === this.head()) return
    const cc = this.state.cursor.prev()
    if (cc.isCorrect()) {
      cc.revert()
      this.setState({cursor: cc})
    } else {
      emit(EventEntry, {entryDelta: 0, errorDelta: -1})
      this.removeNode(cc)
    }
  }

  _characterHandler(c) {
    const cc = this.state.cursor
    if (cc.setEntry(c)) {
      emit(EventEntry, {entryDelta: 1, errorDelta: 0})
      if (cc === this.tail()) {
        this.setState({isComplete: true})
      } else {
        this.setState({cursor: cc.next()})
      }
    } else {
      emit(EventEntry, {entryDelta: 1, errorDelta: 1})
      const errorCC = new CC(c, {isIncorrect: true})
      this.insertNodeBefore(cc, errorCC)
    }
  }

  _input(e, h) {
    if (!this.state.isFocused) return
    if (this.state.isComplete) return
    e.preventDefault()
    e.stopPropagation()

    this._resetCursorInterval()

    h(e.key)
  }

  _numLines(element) {
    return Math.floor((isUndefined(element) ? this._element.offsetHeight : element.offsetHeight) / this._lineHeightPx())
  }

  _scrollCursorIntoView() {
    const cursorLine = Math.floor(this.state.cursor.offsetTop() / this._lineHeightPx()) + 1
    const shift = Math.floor(Math.min(
      Math.max(0, cursorLine - (Math.floor(this._textBoxSize / 2) + 1)),
      Math.max(0, this._numLines() - this._textBoxSize)
    ))
    this.setState({
      shift
    })
  }

  _resetCursorInterval() {
    clearInterval(this._cursorInterval)
    this._cursorInterval = setInterval(...this._cursorIntervalParams)
    this.state.cursor.show()
  }

  _focus() {
    this.setState({isFocused: true})
  }

  _blur() {
    this.setState({isFocused: false})
    emit(EventTypingStop)
  }

  render(prevState) {
    const isInitial = isUndefined(prevState)
    if (!isInitial && prevState.isFocused !== this.state.isFocused) {
      if (this.state.isFocused) {
        this._resetCursorInterval()
      } else {
        clearInterval(this._cursorInterval)
        this.state.cursor.hide()
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

    if (isInitial || prevState.cursor !== this.state.cursor) {
      this.state.cursor.setCursorBefore()
      if (this.state.cursor.prev() !== null) this.state.cursor.prev().unsetCursor()
      if (this.state.cursor.next() !== null) this.state.cursor.next().unsetCursor()
      this._scrollCursorIntoView()
      if (!isInitial) emit(EventProgress, {index: this.state.cursor.index(), length: this._text.length})
    }
    if (!isInitial && !prevState.isComplete && this.state.isComplete) {
      this.state.cursor.setCursorAfter()
      emit(EventProgress, {index: this.state.cursor.index() + 1, length: this._text.length})
      this._complete()
    }

    if (!isInitial && prevState.width !== this.state.width) {
      this._fontSize = getRootFontSize()
      if (this.state.isComplete) {
        this._complete()
      } else {
        this._scrollCursorIntoView()
      }
    }
  }
}
