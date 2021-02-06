import { isUndefined } from '../utils'

import Component from './component'

export default class CC extends Component { // stands for Controlled Character
  static classes = ['cursor', 'cursor-after', 'space', 'correct', 'incorrect']
  static classToKey = CC.classes.reduce((classToKey, c) => {
    return {
      ...classToKey,
      [c]: c.split('-').map(w => `${w[0].toUpperCase()}${w.slice(1)}`).reduce((k, w) => k + w, 'is')
    }
  }, {})

  constructor(c, cc, initialState) {
    const span = document.createElement('span')
    span.classList.add('cc')
    if (!isUndefined(cc)) {
      cc.insertBefore(span)
    }

    super(span, {
      char: c,
      currentChar: c,
      isCursor: false,
      isCursorAfter: false,
      isSpace: c === ' ',
      isCorrect: false,
      isIncorrect: false,
      ...(!isUndefined(initialState) ? initialState : {})
    })
  }

  _setCorrect() {
    this.setState({
      isCorrect: true,
      isIncorrect: false
    })
  }

  _setIncorrect() {
    this.setState({
      isCorrect: false,
      isIncorrect: true
    })
  }

  setChar(c) {
    this.setState({
      char: c,
      currentChar: c
    })
    this.revert()
  }

  revert() {
    this.setState({
      isSpace: false,
      isCorrect: false, 
      isIncorrect: false
    })
  }

  setEntry(c) {
    const correct = this.state.char === c
    if (correct) this._setCorrect()
    return correct
  }

  isCorrect() {
    return this.state.isCorrect
  }

  currentChar() {
    return this.state.currentChar
  }

  setCursorBefore() {
    this.setState({ isCursor: true })
  }

  setCursorAfter() {
    this.setCursorBefore()
    this.setState({ isCursorAfter: true })
  }

  unsetCursor() {
    this.setState({
      isCursor: false,
      isCursorAfter: false
    })
  }

  render(prevState) {
    const isInitial = isUndefined(prevState)
    CC.classes.forEach(c => {
      const k = CC.classToKey[c]
      const b = this.state[k]
      if (isInitial || b !== prevState[k]) {
        if (b) {
          this.classList().add(c)
        } else {
          this.classList().remove(c)
        }
      }
    })

    this.setInnerHTML(this.state.currentChar)
  }
}
