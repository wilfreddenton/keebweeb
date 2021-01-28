const EventEntry = 'keebweeb-entry'
const EventStop = 'keebweeb-stop'

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

function CGroup() {
  const cGroup = document.createElement('span')
  cGroup.classList.add('c-group')
  return cGroup
}

class CC { // stands for Controlled Character
  constructor(c, group) {
    const span = document.createElement('span')
    c = this._transform(c)
    span.innerHTML = c
    span.classList.add('cc')
    group.appendChild(span)

    this._char = c
    this._group = group
    this._element = span
    this._isValid = null
    this._numErrors = 0
  }

  _transform(c) {
    if (c === " ") return "&nbsp;"
    return c
  }

  revert() {
    this._element.classList.remove('space')
    this._element.classList.remove('correct')
    this._element.classList.remove('incorrect')
    this._element.innerHTML = this._char
  }

  validate(c) {
    c = this._transform(c)
    if (c === "&nbsp;") this._element.classList.add('space')
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
    this._element = element
    this._text = text.trim()
    this._cursor = document.createElement('span')
    this._cursorIntervalParams = [() => this._cursor.classList.toggle('hide'), 530]
    this._cursorInterval = null
    this._ccs = []
    this._index = 0

    this._render()
    this._setupListeners()
    this.focus()
  }

  _render() {
    this._cursor.appendChild(document.createElement('span'))
    this._cursor.id = "cursor"
    this._cursor.classList.add('focused')

    const frag = document.createDocumentFragment();
    let cGroup = null
    this._text.split("").forEach(c => {
      if (cGroup === null) cGroup = CGroup()
      const cc = new CC(c, cGroup)
      frag.appendChild(cGroup)
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
      this.input(e.key)
    })
  }

  focus() {
    this._element.classList.add('focused')
    this._cursor.classList.remove('hide')
    clearInterval(this._cursorInterval)
    this._cursorInterval = setInterval(...this._cursorIntervalParams)
  }

  unFocus() {
    this._element.classList.remove('focused')
    clearInterval(this._cursorInterval)
    this._cursor.classList.add('hide')
  }

  input(key) {
    if (!this._element.classList.contains('focused')) return
    if (this._index >= this._text.length) return

    if (key === "Backspace") {
      if (this._index < 1) return
      const cc = this._ccs[this._index-1]
      cc.insertBefore(cursor)
      cc.revert()
      this._index -= 1
    } else {
      if (!/^.$/.test(key)) return
      const cc = this._ccs[this._index]
      cc.validate(key)
      this._index += 1
      if (this._index < this._text.length) {
        this._ccs[this._index].insertBefore(this._cursor)
      } else {
        cc.insertAfter(this._cursor)
        emit(EventStop)
      }
    }

    clearInterval(this._cursorInterval)
    this._cursor.classList.remove('hide')
    this._cursorInterval = setInterval(...this._cursorIntervalParams)
  }
}

class WPM {
  constructor(element, intervalMS) {
    this._element = element
    this._intervalMS = intervalMS || 1000
    this._numEntries = 0
    this._timeLast = 0
    this._timeAverage = 0
    this._numEntriesSnapshot = 0
    this._numErrors = 0
    this._rawWPM = 0
    this._netWPM = 0
    this._numMins = 0
    this._m = 0
    this._s = 0
    this._k = 0
    this._startTime = null
    this._interval = null

    this._setupListeners()
    this._render()
  }

  _setupListeners() {
    listen(EventEntry, ({errorDelta}) => {
      if (this._startTime === null) this._startTime = new Date().getTime()
      this._numEntries += 1
      this._numErrors += errorDelta

      this._updateStats()
      this._render()
    })
  }

  _render() {
    this._element.innerHTML = `${Math.round(this._netWPM)} WPM (consistency: ${this._consistency()}%)`
  }

  _calcRawWPM() {
    return Math.round((this._numEntriesSnapshot / 5) / (this._intervalMS / (1000 * 60)))
  }

  _calcNetWPM() {
    const grossWPM = Math.round((this._numEntries / 5) / this._numMins)
    return Math.max(0, Math.round(grossWPM - this._numErrors / this._numMins))
  }

  _updateStats() {
    const _timeLast = this._timeLast
    const time = new Date().getTime()
    this._timeLast = time
    if (_timeLast === 0) return

    const timeBetween = time - _timeLast
    this._timeAverage = (this._timeAverage + timeBetween)
    this._rawWPM = (60 * 1000) / timeBetween / 5
    this._numMins = (time - this._startTime) / (1000 * 60)
    this._netWPM = this._calcNetWPM()

    const oldM = this._m
    this._m += (this._rawWPM - this._m) / this._numEntries
    this._s += (this._rawWPM - this._m) * (this._rawWPM - oldM)
  }

  _consistency() {
    if (this._numEntries <= 1) return 0
    const stdDev = Math.sqrt(this._s / (this._numEntries - 1))
    const relativeStdDev = stdDev / this._m
    return Math.max(0, Math.round((1 - relativeStdDev) * 100))
  }
}

class Accuracy {
  constructor(element) {
    this._element = element
    this._numEntries = 0
    this._numErrors = 0
    this._interval = null

    this._setupListeners()
    this._render()
  }

  _setupListeners() {
    listen(EventEntry, ({errorDelta}) => {
      this._numEntries += 1
      this._numErrors += errorDelta > -1 ? errorDelta : 0
      this._render()
    })
  }

  _render() {
    this._element.innerHTML = `${Math.round(this.accuracy() * 100)}%`
  }

  accuracy() {
    if (this._numEntries === 0) return 1
    return (this._numEntries - this._numErrors) / this._numEntries
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
    `The sky above the port was the color of television, tuned to a dead channel.`,
    `In the beginning was the Word. Then came the fucking word processor. Then came the thought processor. Then came the death of literature. And so it goes.`,
    `Deep in the human unconscious is a pervasive need for a logical universe that makes sense. But the real universe is always one step beyond logic.`,
    `When you are wrestling for possession of a sword, the man with the handle always wins.`,
    `Mere data makes a man. A and C and T and G. The alphabet of you. All from four symbols. I am only two: 1 and 0.`
  ]

  new Select(document.getElementById('themes'), ['80082 Blu', 'Awaken', 'Cyberspace'], 'theme')
  new WPM(document.getElementById('wpm'))
  new Accuracy(document.getElementById('accuracy'))
  new TextBox(document.getElementById('text-box'), texts[Math.floor(Math.random() * texts.length)])
}

document.addEventListener('DOMContentLoaded', main)
