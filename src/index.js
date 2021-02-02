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
    [this.element().previousSibling, this.element().nextSibling].forEach(e => {
      if (e !== null) e.classList.remove('cursor', 'cursor-hide', 'cursor-after')
    })
    this.classList().add('cursor')
  }

  setCursorAfter() {
    this.setCursorBefore()
    this.classList().add('cursor-after')
  }
}

class TextBox {
  constructor(element, text) {
    this._parent = element
    this._cursorInterval = null
    this._cursorIntervalParams = [() => this._cursor().classList.toggle('cursor-hide'), 530]
    this._reset(text)
    this._setupListeners()
  }

  _cursor() {
    return document.querySelector('.cursor')
  }

  _render() {
    const frag = document.createDocumentFragment();
    this._text.split("").forEach(c => {
      const cc = new CC(c)
      frag.appendChild(cc.element())
      this._ccs.push(cc)
    })
    this._element.appendChild(frag)

    this._ccs[0].setCursorBefore()
  }

  _setupListeners() {
    document.addEventListener('click', this.blur.bind(this))
    this._element.addEventListener('click', e => {
      e.stopPropagation()
      this.focus()
    })
    document.addEventListener('keydown', e => {
      if ([e.altKey, e.ctrlKey, e.metaKey].some(b => b)) return
      switch(e.key) {
      case 'Tab':
        e.preventDefault()
        return
      case 'Escape':
        this.blur()
        return
      case 'Enter':
        this.focus()
        return
      case 'n':
        if (!this._isFocused()) {
          emit(EventStop, {wait: false})
          return
        }
      case 'r':
        if (!this._isFocused()) {
          emit(EventReset, {text: this._text})
          return
        }
      }
      this.input(e)
    })
    listen(EventStop, () => {
      this._complete = true
      this.blur()
    })
    listen(EventReset, ({text}) => {
      this._reset(text)
    })
  }

  _reset(text) {
    if (typeof this._element !== 'undefined') this._element.remove()
    this._element = document.createElement('div')
    this._parent.appendChild(this._element)
    this._text = text.trim()
    this._ccs = []
    this._index = 0
    this._complete = false

    this._render()
    this.focus()
  }

  _isFocused() {
    return this._element.classList.contains('focused')
  }

  focus() {
    if (!this._isFocused()) this._element.classList.add('focused')
    this._cursor().classList.remove('cursor-hide')
    clearInterval(this._cursorInterval)
    this._cursorInterval = setInterval(...this._cursorIntervalParams)
  }

  blur() {
    this._element.classList.remove('focused')
    clearInterval(this._cursorInterval)
    this._cursor().classList.add('cursor-hide')
    emit(EventTypingStop)
  }

  input(e) {
    if (!this._element.classList.contains('focused')) return
    if (this._complete) return
    const key = e.key
    if (key !== "Backspace" && !/^.$/.test(key)) return
    e.preventDefault()
    e.stopPropagation()

    const cursorTopBefore = this._cursor().offsetTop - 9
    this.focus()
    emit(EventTypingStart)

    if (key === "Backspace") {
      if (this._index < 1) return
      this._index -= 1
      const cc = this._ccs[this._index]
      if (cc.isCorrect()) {
        cc.revert()
        cc.setCursorBefore()
      } else {
        cc.remove()
        this._ccs.splice(this._index, 1)
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
        this._ccs[this._index].setCursorBefore()
      } else {
        cc.setCursorAfter()
        if (cc.isCorrect() && this._index === this._ccs.length) this.blur()
      }
    }
    emit(EventProgress, {index: this._index, length: this._ccs.length})

    const cursorTopAfter = this._cursor().offsetTop - 9
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
}

function main() {
  const texts = [
    `She had always felt that the essence of human experience lay not primarily in the peak experiences, the wedding days and triumphs which stood out in the memory like dates circled in red on old calendars, but, rather, in the unself-conscious flow of little things.`,
    `The sky above the port was the color of television, tuned to a dead channel.`,
    `In the beginning was the Word. Then came the fucking word processor. Then came the thought processor. Then came the death of literature. And so it goes.`,
    `Deep in the human unconscious is a pervasive need for a logical universe that makes sense. But the real universe is always one step beyond logic.`,
    `When you are wrestling for possession of a sword, the man with the handle always wins.`,
    `Mere data makes a man. A and C and T and G. The alphabet of you. All from four symbols. I am only two: 1 and 0.`,
    `We are created for precisely this sort of suffering. In the end, it is all we are, these limpid tide pools of self-consciousness between crashing waves of pain. We are destined and designed to bear our pain with us, hugging it tight to our bellies like the young Spartan thief hiding a wolf cub so it can eat away our insides.`,
  ]

  const randomText = () => texts[Math.floor(Math.random() * texts.length)]

  new Select(document.getElementById('themes'), ['80082 Blu', 'Awaken', 'Cyberspace', 'Mecha'], 'theme')
  new WPM(document.getElementById('wpm'))
  new Accuracy(document.getElementById('accuracy'))
  new Progress(document.getElementById('progress'))
  new Fade(document.getElementById('help'))
  let i = 0
  const textBox = new TextBox(document.getElementById('text-box'), texts[i])
  listen(EventStop, () => {
    i = (i + 1) % texts.length
    emit(EventReset, {text: texts[i]})
  })
}

main()
