import './scss/index.scss'

import {
  EventEntry,
  EventProgress,
  EventStop,
  EventReset,
  EventTypingStart,
  EventTypingStop,
  emit,
  listen
} from './events'

import { Element, Fade, isUndefined } from './utils'

import { Accuracy, Progress, Select, WPM } from './components'

class CC extends Element { // stands for Controlled Character
  constructor(c, cc, isCorrect) {
    const span = document.createElement('span')
    span.innerHTML = c
    if (!isUndefined(cc)) {
      cc.insertBefore(span)
    }
    super(span)
    this.classList().add('cc')

    this._char = c

    if (!isUndefined(isCorrect)) {
      isCorrect ? this._setCorrect() : this._setIncorrect()
    }

    if (this._char === ' ') this.classList().add('space')
  }

  _setCorrect() {
    this.classList().remove('incorrect')
    this.classList().add('correct')
  }

  _setIncorrect() {
    this.classList().remove('correct')
    this.classList().add('incorrect')
  }

  setChar(c) {
    this._char = c
    this.revert()
  }

  revert() {
    this.classList().remove('space', 'correct', 'incorrect')
    this.setInnerHTML(this._char)
  }

  setEntry(c) {
    const correct = this._char === c
    if (correct) this._setCorrect()
    return correct
  }

  isCorrect() {
    return this.classList().contains('correct')
  }

  currentChar() {
    return this.getInnerHTML()
  }

  lineHeight() {
    return 48;
  }

  setCursorBefore() {
    this.adjacentSiblings().forEach(e => {
      if (e !== null) e.classList.remove('cursor', 'cursor-hide', 'cursor-after')
    })
    this.classList().add('cursor')
  }

  setCursorAfter() {
    this.setCursorBefore()
    this.classList().add('cursor-after')
  }
}

class TextBox extends Element {
  constructor(element) {
    super(document.createElement('div'))
    this._parent = element
    this._parent.appendChild(this._element)
    this._text = ""
    this._ccs = []
    this._cursor = null
    this._cursorInterval = null
    this._cursorIntervalParams = [() => this._cursor.classList.toggle('cursor-hide'), 530]
    this._setupListeners()
  }

  _setCursor(cc, after) {
    after = isUndefined(after) ? false : after
    after ? cc.setCursorAfter() : cc.setCursorBefore()
    this._cursor = cc._element
  }

  _reset(text) {
    this._text = text.trim()
    this._index = 0

    this._element.style.marginTop = '0rem'
    this._render()
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
      this._input(e)
    }
  }

  _input(e) {
    if (!this._isFocused()) return
    if (this._index >= this._ccs.length) return
    const key = e.key
    if (key !== "Backspace" && !/^.$/.test(key)) return
    e.preventDefault()
    e.stopPropagation()

    const cursorTopBefore = this._cursor.offsetTop - 9
    this._resetCursorInterval()
    emit(EventTypingStart)

    if (key === "Backspace") {
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
    } else {
      const cc = this._ccs[this._index]
      if (cc.setEntry(key)) {
        emit(EventEntry, {entryDelta: 1, errorDelta: 0})
      } else {
        const errorCC = new CC(key, cc, false)
        this._ccs.splice(this._index, 0, errorCC)
        emit(EventEntry, {entryDelta: 1, errorDelta: 1})
      }

      this._index += 1
      if (this._index < this._ccs.length) {
        this._setCursor(this._ccs[this._index])
      } else {
        this._setCursor(cc, true)
        if (cc.isCorrect() && this._index === this._ccs.length) this._blur()
      }
    }
    emit(EventProgress, {index: this._index, length: this._ccs.length})

    const cursorTopAfter = this._cursor.offsetTop - 9
    const cursorTopDiff = cursorTopAfter - cursorTopBefore
    if (cursorTopDiff === 0) return
    const lineHeight = this._ccs[this._text.length - 1].lineHeight()
    const marginTop = this._element.style.marginTop === ""
          ? 0
          : parseInt(this._element.style.marginTop.match(/-?\d+/)[0])
    if (cursorTopDiff > 0
        && cursorTopAfter > lineHeight
        && this._parent.offsetHeight !== this._element.offsetHeight + this._element.offsetTop) {
      this._element.style.marginTop = `${marginTop - 3}rem`
    }
    if (cursorTopDiff < 0
        && cursorTopBefore === lineHeight
        && this._element.offsetTop !== 0) {
      this._element.style.marginTop = `${marginTop + 3}rem`
    }
  }

  _isFocused() {
    return this.classList().contains('focused')
  }

  _resetCursorInterval() {
    clearInterval(this._cursorInterval)
    this._cursorInterval = setInterval(...this._cursorIntervalParams)
  }

  _focus() {
    if (!this._isFocused()) this.classList().add('focused')
    this._cursor.classList.remove('cursor-hide')
    this._resetCursorInterval()
  }

  _blur() {
    this.classList().remove('focused')
    clearInterval(this._cursorInterval)
    this._cursor.classList.add('cursor-hide')
    emit(EventTypingStop)
  }
}

function main() {
  const texts = [
    `Irrevocable commitment to any religion is not only intellectual suicide; it is positive unfaith because it closes the mind to any new vision of the world. Faith is, above all, open-ness--an act of trust in the unknown.`,
    `The wise man molds himself--the fool lives only to die.`,
    `Prophecy and prescience--How can they be put to the test in the face of the unanswered question? Consider: How much is actual prediction of the "wave form" (as Muad'Dib referred to his vision-image) and how much is the prophet shaping the future to fit the prophecy?`,
    `Expectations are the cause of all my problems.`,
    `If the ego is not regularly and repeatedly dissolved in the unbounded hyperspace of the Transcendent Other, there will always be slow drift away from the sense of self as part of nature's larger whole. The ultimate consequence of this drift is the fatal ennui that now permeates Western civilization.`,
    `If there are gods and they are just, then they will not care how devout you have been, but will welcome you based on the virtues you have lived by.`
  ]

  const randomText = () => texts[Math.floor(Math.random() * texts.length)]

  new Select(document.getElementById('themes'), ['80082 Blu', 'Awaken', 'Cyberspace', 'Mecha', 'Muted', 'Superuser'], 5, 'theme')
  new WPM(document.getElementById('wpm'))
  new Accuracy(document.getElementById('accuracy'))
  new Progress(document.getElementById('progress'))
  new Fade(document.getElementById('help'))
  const textBox = new TextBox(document.getElementById('text-box'))

  let i = 0
  const resetHandler = (e) => {
    const params = new URLSearchParams(window.location.search)
    i = params.has('index') ? params.get('index') : 0
    emit(EventReset, {text: texts[i]})
  }
  window.onpopstate = resetHandler
  listen(EventStop, () => {
    i = (i + 1) % texts.length
    history.pushState({index: i}, 'KeebWeeb', `?index=${i}`)
    emit(EventReset, {text: texts[i]})
  })

  resetHandler()
}

main()
