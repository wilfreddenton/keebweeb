class CC { // stands for Controlled Character
  constructor(c) {
    const span = document.createElement('span')
    c = this._transform(c)
    span.innerHTML = c
    span.classList.add('cc')

    this._char = c
    this._element = span
  }

  _transform(c) {
    if (c === " ") return "&nbsp;"
    return c
  }

  appendElementTo(parent) {
    parent.appendChild(this._element)
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
    this._element.classList.add(this._char === c ? 'correct' : 'incorrect')
    this._element.innerHTML = c
  }

  insertBefore(element) {
    this._element.parentNode.insertBefore(element, this._element)
  }

  insertAfter(element) {
    this._element.parentNode.appendChild(element)
  }
}

function CGroup() {
  const cGroup = document.createElement('span')
  cGroup.classList.add('c-group')
  return cGroup
}

function Cursor() {
  const outerSpan = document.createElement('span')
  const innerSpan = document.createElement('span')
  outerSpan.appendChild(innerSpan)
  outerSpan.id = "cursor"
  return outerSpan
}

document.addEventListener('DOMContentLoaded', () => {
  const text = `The sky above the port was the color of television, tuned to a dead channel.`
  const elements = {
    leader: document.getElementById('leader'),
    cursor: new Cursor(),
  }
  const cursorIntervalParams = [() => elements.cursor.classList.toggle('hide'), 530]
  const state = {
    leaderChars: [],
    index: 0,
    typingTimeout: null,
    cursorInterval: null
  }

  const frag = document.createDocumentFragment();
  let cGroup = null
  text.split("").forEach(c => {
    if (cGroup === null) cGroup = CGroup()
    const cc = new CC(c)
    cc.appendElementTo(cGroup)
    frag.appendChild(cGroup)
    state.leaderChars.push(cc)
    if (c === " ") cGroup = null
  })
  elements.leader.appendChild(frag)
  state.leaderChars[state.index].insertBefore(elements.cursor)

  state.cursorInterval = setInterval(...cursorIntervalParams)
  document.addEventListener('click', e => {
    elements.leader.classList.remove('focused')
    clearInterval(state.cursorInterval)
    elements.cursor.classList.add('hide')
  })
  leader.addEventListener('click', e => {
    e.stopPropagation()
    elements.leader.classList.add('focused')
    elements.cursor.classList.remove('hide')
    clearInterval(state.cursorInterval)
    state.cursorInterval = setInterval(...cursorIntervalParams)
  })

  document.addEventListener('keydown', e => {
    if ([e.altKey, e.ctrlKey, e.metaKey].some(b => b)) return
    if (!leader.classList.contains('focused')) return
    if (state.index >= text.length) return

    clearInterval(state.cursorInterval)
    clearTimeout(state.typingTimeout)
    elements.cursor.classList.remove('hide')
    let cc = null
    if (e.key === "Backspace") {
      if (state.index < 1) return
      cc = state.leaderChars[state.index-1]
      cc.insertBefore(cursor)
      cc.revert()
      state.index -= 1
    } else {
      if (!/^.$/.test(e.key)) return
      cc = state.leaderChars[state.index]
      cc.validate(e.key)
      state.index += 1
      if (state.index < text.length) {
        state.leaderChars[state.index].insertBefore(cursor)
      } else {
        cc.insertAfter(cursor)
      }
    }
    state.cursorInterval = setInterval(...cursorIntervalParams)
  })
})
