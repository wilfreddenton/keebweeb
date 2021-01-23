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
  const leader = document.getElementById('leader')
  const frag = document.createDocumentFragment()
  const leaderChars = []
  let cGroup = null
  text.split("").forEach(c => {
    if (cGroup === null) cGroup = CGroup()
    const cc = new CC(c)
    cc.appendElementTo(cGroup)
    frag.appendChild(cGroup)
    leaderChars.push(cc)
    if (c === " ") cGroup = null
  })
  leader.appendChild(frag)

  let index = 0
  let modifierDown = false
  const cursor = new Cursor()
  leaderChars[index].insertBefore(cursor)
  const cursorPhaseParams = [() => cursor.classList.toggle('hide'), 530]
  cursorPhaseInterval = setInterval(...cursorPhaseParams)
  document.addEventListener('click', e => {
    leader.classList.remove('focused')
    clearInterval(cursorPhaseInterval)
    cursor.classList.add('hide')
  })
  leader.addEventListener('click', e => {
    e.stopPropagation()
    leader.classList.add('focused')
    cursor.classList.remove('hide')
    cursorPhaseInterval = setInterval(...cursorPhaseParams)
  })
  typingTimeout = null
  document.addEventListener('keydown', e => {
    if ([e.altKey, e.ctrlKey, e.metaKey].some(b => b)) return
    if (!leader.classList.contains('focused')) return
    if (index >= text.length) return

    console.log(index, e)
    clearInterval(cursorPhaseInterval)
    clearTimeout(typingTimeout)
    cursor.classList.remove('hide')
    let cc = null
    if (e.key === "Backspace") {
      if (index < 1) return
      cc = leaderChars[index-1]
      cc.insertBefore(cursor)
      cc.revert()
      index -= 1
    } else {
      if (!/^.$/.test(e.key)) return
      cc = leaderChars[index]
      cc.validate(e.key)
      index += 1
      if (index < text.length) {
        leaderChars[index].insertBefore(cursor)
      } else {
        cc.insertAfter(cursor)
      }
    }
    cursorPhaseInterval = setInterval(...cursorPhaseParams)
  })
})
