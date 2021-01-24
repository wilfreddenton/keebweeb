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
    if (this._isValid === null) {
      const eventName = isValid ? 'inc-entries' : 'inc-errors'
      document.dispatchEvent(new Event(eventName))
    } else if (!this._isValid && isValid) {
      document.dispatchEvent(new Event('dec-errors'))
      document.dispatchEvent(new Event('inc-entries'))
    } else if (this._isValid && !isValid) {
      document.dispatchEvent(new Event('dec-entries'))
      document.dispatchEvent(new Event('inc-errors'))
    }
    this._isValid = isValid
  }

  insertBefore(element) {
    this._group.insertBefore(element, this._element)
  }

  insertAfter(element) {
    this._group.insertBefore(element, this._element.nextSibling)
  }
}

class TextBox {
  constructor(id, text) {
    this._text = text.trim()
    this._box = document.getElementById(id)
    this._cursor = document.createElement('span')
    this._cursorIntervalParams = [() => this._cursor.classList.toggle('hide'), 530]
    this._cursorInterval = null
    this._ccs = []
    this._index = 0
    this._startTime = null

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
    this._box.appendChild(frag)
    this._ccs[this._index].insertBefore(this._cursor)
  }

  _setupListeners() {
    document.addEventListener('click', this.unFocus.bind(this))
    this._box.addEventListener('click', e => {
      e.stopPropagation()
      this.focus()
    })
    document.addEventListener('keydown', e => {
      if ([e.altKey, e.ctrlKey, e.metaKey].some(b => b)) return
      this.input(e.key)
    })
  }

  focus() {
    this._box.classList.add('focused')
    this._cursor.classList.remove('hide')
    clearInterval(this._cursorInterval)
    this._cursorInterval = setInterval(...this._cursorIntervalParams)
  }

  unFocus() {
    this._box.classList.remove('focused')
    clearInterval(this._cursorInterval)
    this._cursor.classList.add('hide')
  }

  input(key) {
    if (!this._box.classList.contains('focused')) return
    if (this._index >= this._text.length) return

    clearInterval(this._cursorInterval)
    this._cursor.classList.remove('hide')

    if (this._startTime === null) {
      this._startTime = new Date().getTime()
    }

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
        document.dispatchEvent(new Event('stop'))
      }
    }

    this._cursorInterval = setInterval(...this._cursorIntervalParams)
  }
}

class WPM {
  constructor(id) {
    this._element = document.getElementById(id)
    this._innerElement = document.createElement('span')
    this._numEntries = 0
    this._numErrors = 0
    this._startTime = null
    this._interval = null

    this._setupListeners()
    this._render()
  }

  _baseListener(l) {
    return () => {
      if (this._startTime === null) {
        this._startTime = new Date().getTime()
        this._interval = setInterval(() => {
          this._render()
        }, 100)
      }
      l()
    }
  }

  _setupListeners() {
    document.addEventListener('inc-entries', this._baseListener(() => {
      this._numEntries += 1
    }))
    document.addEventListener('inc-errors', this._baseListener(() => {
      this._numErrors += 1
    }))
    document.addEventListener('dec-entries', () => {
      this._numEntries -= 1
    })
    document.addEventListener('dec-errors', () => {
      this._numErrors -= 1
    })
    document.addEventListener('stop', () => {
      clearInterval(this._interval)
    })
  }

  _render() {
    this._element.innerHTML = Math.round(this.netWPM(this._numMins()))
  }

  _numMins() {
    return (new Date().getTime() - this._startTime) / (1000 * 60)
  }

  grossWPM(numMins) {
    return (this._numEntries / 5) / numMins
  }

  netWPM(numMins) {
    const wpm = this.grossWPM(numMins) - this._numErrors / numMins
    return wpm < 0 ? 0 : wpm
  }
}

function main() {
  // document.body.classList.add('theme--80082-blu')
  document.body.classList.add('theme--cyberspace')
  new WPM('wpm')
  new TextBox('text-box', `The sky above the port was the color of television, tuned to a dead channel.`)
}

document.addEventListener('DOMContentLoaded', () => main())
