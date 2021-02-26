import {
  EventComplete,
  EventEntry,
  EventProgress,
  EventReset,
  EventNext,
  EventTypingStop,
  emit,
  listen
} from '../events'

import {
  EntryType,
  getLineHeightRem,
  getNumLines,
  getRootFontSize,
  isUndefined
} from '../utils'

import Text from '../text'

import Accuracy from './accuracy'
import CC from './cc'
import WPM from './wpm'
import { LinkedList } from './linked_list'

export default class TextBox extends LinkedList {
  static cursorIntervalMS = 530

  constructor(parent) {
    super(document.createElement('div'), {
      parentHeight: null,
      shift: 0,
      isFocused: false,
      isComplete: false,
      cursor: null,
      width: window.innerWidth,
      text: null
    })

    this._fakeBox = document.createElement('textarea')
    this._fakeBox.id = 'fake-box'
    this._parent = parent
    this._parent.appendChild(this._fakeBox)
    this._parent.appendChild(this._element)
    this._cursorInterval = null
    this._cursorIntervalParams = [() => this.state.cursor.toggle(), TextBox.cursorIntervalMS]
    this._fontSize = getRootFontSize()
    this._lineHeightRem = getLineHeightRem(this._parent, this._fontSize)
    this._lineHeightPx = this._fontSize * this._lineHeightRem
    this._textBoxSize = getNumLines(this._parent, this._lineHeightPx)
    this._accuracy = new Accuracy(document.getElementById('accuracy'))
    this._wpm = new WPM(document.getElementById('wpm'))

    this._numLines = 0

    this._setupListeners()
  }

  _setupListeners() {
    document.addEventListener('click', this._blur.bind(this))
    this._parent.addEventListener('click', e => {
      e.stopPropagation()
      this._focus()
    })
    document.addEventListener('keydown', e => {
      if ([e.altKey, e.ctrlKey, e.metaKey].some(b => b)) return
      this._entryHandler(e)
    })
    listen(EventNext, this._blur.bind(this))
    listen(EventReset, ({text}) => this.setState({text}))
    this.onResize(this.state.width, width => this.setState({width}))
  }

  _entryHandler(e) {
    switch(e.key) {
      case 'Tab':
        e.preventDefault()
        break
      case 'Escape':
        e.preventDefault()
        this._blur()
        break
      case 'Enter':
        e.preventDefault()
        this._focus()
        break
      case 'Backspace':
        e.preventDefault()
        this._input(e, this._backspaceHandler.bind(this))
        break
      case 'n':
        e.preventDefault()
        if (!this.state.isFocused) {
          emit(EventNext)
          break
        }
      case 'r':
        e.preventDefault()
        if (!this.state.isFocused) {
          emit(EventReset, {text: new Text(this.state.text)})
          break
        }
      default:
        if (!/^.$/.test(e.key)) break
        e.preventDefault()
        this._input(e, this._characterHandler.bind(this))
    }
  }

  _backspaceHandler() {
    if (this.state.cursor === this.head()) return
    const cc = this.state.cursor.prev()
    if (cc.isCorrect()) {
      cc.revert()
      this._entry(EntryType.revert)
      this.setState({cursor: cc})
    } else {
      this._entry(EntryType.fix)
      this.removeNode(cc)
    }
  }

  _characterHandler(c) {
    const cc = this.state.cursor
    if (cc.setEntry(c)) {
      this._entry(EntryType.correct)
      if (cc === this.tail()) {
        this.setState({isComplete: true})
      } else {
        this.setState({cursor: cc.next()})
      }
    } else {
      this._entry(EntryType.incorrect)
      const errorCC = new CC(c, cc.index(), {isIncorrect: true})
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

  _newLinkedList() {
    let node = this.head()
    for (let i = 0; i < this.state.text.length(); i += 1) {
      const c = this.state.text.charAt(i)
      if (node === null) {
        const cc = new CC(c, i)
        this.push(cc)
        node = null
      } else {
        node.setChar(c, i)
        node = node.next()
      }
    }
    this.chop(node)
  }

  _focus() {
    this.setState({isFocused: true})
  }

  _blur() {
    this.setState({isFocused: false})
  }

  _showFullText() {
    const parentHeight = this._lineHeightRem * this._textBoxSize
    const height = this._lineHeightRem * this._numLines
    this.setState({
      parentHeight: Math.max(parentHeight, height),
      shift: 0
    })
    setTimeout(this._blur.bind(this), TextBox.cursorIntervalMS)
  }

  _scrollCursorIntoView() {
    const cursorLine = Math.floor(this.state.cursor.offsetTop() / this._lineHeightPx) + 1
    const shift = Math.floor(Math.min(
      Math.max(0, cursorLine - (Math.floor(this._textBoxSize / 2) + 1)),
      Math.max(0, this._numLines - this._textBoxSize)
    ))
    this.setState({ shift })
  }

  _resetCursorInterval() {
    clearInterval(this._cursorInterval)
    this._cursorInterval = setInterval(...this._cursorIntervalParams)
    this.state.cursor.show()
  }

  _entry(type) {
    const time = new Date().getTime()
    const accuracy = this._accuracy.entry(type, time)
    const wpm = this._wpm.entry(type, time)
    emit(EventEntry, {type, time, wpm, accuracy})
  }

  render(prevState, deltas) {
    if (isUndefined(prevState)) return

    if (!isUndefined(deltas.isFocused)) {
      if (this.state.isFocused) {
        this._resetCursorInterval()
        this._fakeBox.focus()
      } else {
        clearInterval(this._cursorInterval)
        this.state.cursor.hide()
        this._fakeBox.blur()
        emit(EventTypingStop)
      }
    }

    if (prevState.parentHeight !== this.state.parentHeight) {
      if (this.state.parentHeight === null) {
        this._parent.style.height = ''
      } else {
        this._parent.style.height = `${this.state.parentHeight}rem`
      }
    }

    if (prevState.shift !== this.state.shift) {
      this.style().transform = `translateY(${-this.state.shift*this._lineHeightRem}rem)`
    }

    if (prevState.cursor !== this.state.cursor) {
      this.state.cursor.setCursorBefore()
      if (this.state.cursor.prev() !== null) this.state.cursor.prev().unsetCursor()
      if (this.state.cursor.next() !== null) this.state.cursor.next().unsetCursor()
      emit(EventProgress, {index: this.state.cursor.index()})
      this._scrollCursorIntoView()
    }
    if (this.state.cursor !== null && prevState.length !== this.state.length) {
      this._numLines = getNumLines(this._element, this._lineHeightPx)
      this._scrollCursorIntoView()
    }
    if (!prevState.isComplete && this.state.isComplete) {
      this.state.cursor.setCursorAfter()
      emit(EventProgress, {index: this.state.cursor.index() + 1})
      this._showFullText()
      emit(EventComplete)
    }

    if (prevState.width !== this.state.width) {
      this._fontSize = getRootFontSize()
      this._lineHeightPx = this._fontSize * this._lineHeightRem
      this._numLines = getNumLines(this._element, this._lineHeightPx)
      if (this.state.isComplete) {
        this._showFullText()
      } else {
        this._scrollCursorIntoView()
      }
    }

    if (prevState.text !== this.state.text) {
      this._newLinkedList()
      this.setState({
        parentHeight: null,
        shift: 0,
        cursor: this.head(),
        isComplete: false,
        isFocused: true
      })
      this._accuracy.reset()
      this._wpm.reset()
      this._numLines = getNumLines(this._element, this._lineHeightPx)
    }
  }
}
