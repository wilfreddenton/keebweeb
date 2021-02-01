import './scss/index.scss'

const EventEntry = 'keebweeb-entry',
      EventProgress = 'keepweeb-progress',
      EventStop = 'keebweeb-stop',
      EventReset = 'keebweeb-reset'

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

function CGroup(parent) {
  const cGroup = document.createElement('span')
  cGroup.classList.add('c-group')
  parent.appendChild(cGroup)
  return cGroup
}

class CC { // stands for Controlled Character
  constructor(c, group) {
    const span = document.createElement('span')
    span.innerHTML = c
    span.classList.add('cc')
    group.appendChild(span)

    this._char = c
    this._group = group
    this._element = span
    this._isValid = null
    this._numErrors = 0
  }

  isValid() {
    return this._isValid
  }

  revert() {
    this._element.classList.remove('space')
    this._element.classList.remove('correct')
    this._element.classList.remove('incorrect')
    this._element.innerHTML = this._char
  }

  validate(c) {
    if (c === " ") this._element.classList.add('space')
    const isValid = this._char === c
    this._element.classList.add(isValid ? 'correct' : 'incorrect')
    this._element.innerHTML = c
    let errorDelta = 0
    if (!isValid) {
      errorDelta = 1
    } else if (this._isValid === false) {
      errorDelta = -this._numErrors
    }
    this._numErrors += errorDelta
    this._isValid = isValid
    emit(EventEntry, {errorDelta})
    return this._isValid
  }

  group() {
    return this._group
  }

  removeFromDOM() {
    this._element.remove()
    if (this._group.querySelectorAll('.cc').length === 0) this._group.remove()
  }

  currentChar() {
    return this._element.innerHTML
  }

  lineHeight() {
    return this._group.offsetHeight
  }

  insertBefore(element) {
    this._group.insertBefore(element, this._element)
  }

  insertAfter(element) {
    this._group.insertBefore(element, this._element.nextSibling)
  }
}

class TextBox {
  constructor(element, text) {
    this._parent = element
    this._cursorInterval = null
    this._cursorIntervalParams = [() => this._cursor.classList.toggle('hide'), 530]
    this._reset(text)
    this._setupListeners()
  }

  _render() {
    this._cursor.appendChild(document.createElement('span'))
    this._cursor.id = "cursor"
    this._cursor.classList.add('focused')

    const frag = document.createDocumentFragment();
    let cGroup = null
    this._text.split("").forEach(c => {
      if (cGroup === null) cGroup = CGroup(frag)
      const cc = new CC(c, cGroup)
      this._ccs.push(cc)
      if (c === " ") cGroup = null
    })
    this._element.appendChild(frag)
    this._ccs[this._index].insertBefore(this._cursor)
  }

  _setupListeners() {
    document.addEventListener('click', this.unFocus.bind(this))
    this._element.addEventListener('click', e => {
      e.stopPropagation()
      this.focus()
    })
    document.addEventListener('keydown', e => {
      if ([e.altKey, e.ctrlKey, e.metaKey].some(b => b)) return
      switch(e.key) {
      case 'Escape':
        this.unFocus()
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
      this.unFocus()
    })
    listen(EventReset, ({text}) => {
      this._reset(text)
    })
  }

  _reset(text) {
    if (typeof this._element !== 'undefined') this._element.remove()
    this._element = document.createElement('div')
    this._parent.appendChild(this._element)
    this._cursor = document.createElement('span')
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
    this._cursor.classList.remove('hide')
    clearInterval(this._cursorInterval)
    this._cursorInterval = setInterval(...this._cursorIntervalParams)
  }

  unFocus() {
    this._element.classList.remove('focused')
    clearInterval(this._cursorInterval)
    this._cursor.classList.add('hide')
  }

  input(e) {
    if (!this._element.classList.contains('focused')) return
    if (this._complete) return
    const key = e.key
    if (key !== "Backspace" && !/^.$/.test(key)) return
    e.preventDefault()
    e.stopPropagation()

    const cursorTopBefore = this._cursor.offsetTop
    this.focus()

    if (key === "Backspace") {
      if (this._index < 1) return
      this._index -= 1
      const cc = this._ccs[this._index]
      if (this._index < this._text.length) {
        cc.insertBefore(this._cursor)
        cc.revert()
      } else {
        this._ccs[this._index - 1].insertAfter(this._cursor)
        cc.removeFromDOM()
        this._ccs.splice(this._index, 1)
      }
    } else {
      let cc = null
      if (this._index < this._text.length) {
        cc = this._ccs[this._index]
      } else {
        const prevCC = this._ccs[this._index - 1]
        const group = prevCC.currentChar() === ' ' ? CGroup(this._element) : prevCC.group()
        cc = new CC('\n', group)
        this._ccs.push(cc)
      }

      const isValid = cc.validate(key)

      this._index += 1
      if (this._index < this._text.length) {
        this._ccs[this._index].insertBefore(this._cursor)
      } else {
        cc.insertAfter(this._cursor)
        if (isValid && this._index === this._text.length) this.unFocus()
      }
    }
    emit(EventProgress, {index: this._index, length: this._text.length})

    const cursorTopAfter = this._cursor.offsetTop
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

class WPM {
  constructor(element, intervalMS) {
    this._element = element
    this._intervalMS = intervalMS || 1000

    this._reset()
    this._setupListeners()
  }

  _setupListeners() {
    listen(EventEntry, ({errorDelta}) => {
      if (this._startTime === null) this._startTime = new Date().getTime()
      this._numEntries += 1
      this._numErrors += errorDelta

      this._updateStats()
      this._render()
    })
    listen(EventReset, this._reset.bind(this))
  }

  _reset() {
    this._numEntries = 0
    this._timeLast = 0
    this._numErrors = 0
    this._rawWPM = 0
    this._netWPM = 0
    this._startTime = null

    this._render()
  }

  _render() {
    this._element.innerHTML = `${Math.round(this._netWPM)} WPM (raw: ${this._rawWPM})`
  }

  _updateStats() {
    let _timeLast = this._timeLast
    const time = new Date().getTime()
    this._timeLast = time
    if (_timeLast === 0) return

    const timeBetween = time - _timeLast
    this._rawWPM = Math.round(((60 * 1000) / timeBetween) / 5)
    const numMins = (time - this._startTime) / (1000 * 60)
    const grossWPM = Math.round((this._numEntries / 5) / numMins)
    this._netWPM = Math.max(0, Math.round(grossWPM - this._numErrors / numMins))
  }

}

class Accuracy {
  constructor(element) {
    this._element = element

    this._reset()
    this._setupListeners()
  }

  _setupListeners() {
    listen(EventEntry, ({errorDelta}) => {
      this._numEntries += 1
      this._numErrors += errorDelta > -1 ? errorDelta : 0
      this._render()
    })
    listen(EventReset, this._reset.bind(this))
  }

  _reset() {
    this._numEntries = 0
    this._numErrors = 0

    this._render()
  }

  _render() {
    this._element.innerHTML = `Accuracy: ${Math.floor(this.accuracy() * 100)}%`
  }

  accuracy() {
    if (this._numEntries === 0) return 1
    return (this._numEntries - this._numErrors) / this._numEntries
  }
}

class Progress {
  constructor(element) {
    this._element = element

    this._reset()
    this._setupListeners()
  }

  _setupListeners() {
    listen(EventProgress, ({index, length}) => {
      this._progress = Math.floor((index / length) * 100)
      this._render()
    })
    listen(EventReset, () => {
      this._reset()
    })
  }

  _reset() {
    this._progress = 0
    this._render()
  }

  _render() {
    this._element.innerHTML = `Progress: ${this._progress}%`
  }
}

class Select {
  constructor(element, labels, prefix) {
    this._element = element
    this._options = labels.map(t => ({label: t, value: `${prefix}--${t.toLowerCase().replace(' ', '-')}`}))
    this._prefix = prefix

    this._setupListeners()
    this._render()
  }

  _getSelected() {
    return localStorage.getItem(`${this._prefix}--selected`)
  }

  _setSelected(selected) {
    window.localStorage.setItem(`${this._prefix}--selected`, selected)
  }

  _setupListeners() {
    this._element.addEventListener('change', e => {
      this._updateSelected(e.target.value)
    })
  }

  _updateSelected(selected) {
    const currentSelection = this._getSelected()
    if (currentSelection !== null) {
      document.body.classList.remove(currentSelection)
    }

    this._setSelected(selected)
    document.body.classList.add(selected)
    this._element.value = selected
  }

  _render() {
    this._element.innerHTML = this._options.reduce((html, {label, value}) => {
      return `${html}<option value="${value}">${label}</option>\n`
    }, '')

    this._updateSelected(this._getSelected() === null ? this._options[0].value : this._getSelected())
  }
}

function main() {
  const texts = [
    `We are created for precisely this sort of suffering. In the end, it is all we are, these limpid tide pools of self-consciousness between crashing waves of pain. We are destined and designed to bear our pain with us, hugging it tight to our bellies like the young Spartan thief hiding a wolf cub so it can eat away our insides.`,
    `She had always felt that the essence of human experience lay not primarily in the peak experiences, the wedding days and triumphs which stood out in the memory like dates circled in red on old calendars, but, rather, in the unself-conscious flow of little things.`,
    `The sky above the port was the color of television, tuned to a dead channel.`,
    `In the beginning was the Word. Then came the fucking word processor. Then came the thought processor. Then came the death of literature. And so it goes.`,
    `Deep in the human unconscious is a pervasive need for a logical universe that makes sense. But the real universe is always one step beyond logic.`,
    `When you are wrestling for possession of a sword, the man with the handle always wins.`,
    `Mere data makes a man. A and C and T and G. The alphabet of you. All from four symbols. I am only two: 1 and 0.`
  ]

  const randomText = () => texts[Math.floor(Math.random() * texts.length)]

  new Select(document.getElementById('themes'), ['80082 Blu', 'Awaken', 'Cyberspace', 'Mecha'], 'theme')
  new WPM(document.getElementById('wpm'))
  new Accuracy(document.getElementById('accuracy'))
  new Progress(document.getElementById('progress'))
  const textBox = new TextBox(document.getElementById('text-box'), randomText())
  listen(EventStop, () => {
    emit(EventReset, {text: randomText()})
  })
}

main()
