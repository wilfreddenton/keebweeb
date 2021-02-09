import {
  EventEntry,
  EventProgress,
  EventReset,
  EventStop,
  EventTypingStop,
  emit,
  listen
} from '../events'

import {
  debounce,
  getLineHeightRem,
  getNumLines,
  getRootFontSize,
  isUndefined
} from '../utils'

import Text from '../text'

import CC from './cc'
import { LinkedList } from './linked_list'

function emitEventEntry(entryType) {
  const time = new Date().getTime()
  switch(entryType) {
    case 'correct':
      emit(EventEntry, {entryDelta: 1, errorDelta: 0, time})
      break
    case 'incorrect':
      emit(EventEntry, {entryDelta: 1, errorDelta: 1, time})
      break
    case 'fix':
      emit(EventEntry, {entryDelta: 0, errorDelta: -1, time})
      break
  }
}

export default class TextBox extends LinkedList {
  static cursorIntervalMS = 530

  constructor(element) {
    super(document.createElement('div'), {
      parentHeight: null,
      shift: 0,
      isFocused: false,
      isComplete: false,
      cursor: null,
      width: window.innerWidth,
      text: null
    })

    this._parent = element
    this._parent.appendChild(this._element)
    this._cursorInterval = null
    this._cursorIntervalParams = [() => this.state.cursor.toggle(), TextBox.cursorIntervalMS]
    this._fontSize = getRootFontSize()
    this._lineHeightRem = getLineHeightRem(this._parent, this._fontSize)
    this._lineHeightPx = this._fontSize * this._lineHeightRem
    this._textBoxSize = getNumLines(this._parent, this._lineHeightPx)
    this._numLines = 0

    this._setupListeners()
  }

  _setupListeners() {
    window.addEventListener('resize', debounce(() => this.setState({
      width: window.innerWidth
    }), 100))
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
    listen(EventReset, ({text}) => this.setState({text}))
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
          emit(EventReset, {text: new Text(this.state.text)})
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
      emitEventEntry('fix')
      this.removeNode(cc)
    }
  }

  _characterHandler(c) {
    const cc = this.state.cursor
    if (cc.setEntry(c)) {
      emitEventEntry('correct')
      if (cc === this.tail()) {
        this.setState({isComplete: true})
      } else {
        this.setState({cursor: cc.next()})
      }
    } else {
      emitEventEntry('incorrect')
      const errorCC = new CC(c, -1, {isIncorrect: true})
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

  render(prevState) {
    if (isUndefined(prevState)) return

    if (prevState.isFocused !== this.state.isFocused) {
      if (this.state.isFocused) {
        this._resetCursorInterval()
      } else {
        clearInterval(this._cursorInterval)
        this.state.cursor.hide()
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
      this._scrollCursorIntoView()
      emit(EventProgress, {index: this.state.cursor.index()})
    }
    if (!prevState.isComplete && this.state.isComplete) {
      this.state.cursor.setCursorAfter()
      emit(EventProgress, {index: this.state.cursor.index() + 1})
      this._showFullText()
    }

    if (this.state.cursor !== null && prevState.length !== this.state.length) {
      this._numLines = getNumLines(this._element, this._lineHeightPx)
      this._scrollCursorIntoView()
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
      this._numLines = getNumLines(this._element, this._lineHeightPx)
    }
  }
}
