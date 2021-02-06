import { isUndefined } from '../utils'

import Component from './component'

export default class CC extends Component { // stands for Controlled Character
  constructor(c, cc, isCorrect) {
    const span = document.createElement('span')
    span.innerHTML = c
    if (!isUndefined(cc)) {
      cc.insertBefore(span)
    }
    super(span)
    this.classList().add('cc')


    this.state = {
      char: c,
      currentChar: c,
      isCursor: false,
      isCursorAfter: false,
      isSpace: c === ' ',
      isCorrect: false,
      isIncorrect: false,
    }
    this.stateChangeHandlers = [this._render]

    if (!isUndefined(isCorrect)) isCorrect ? this._setCorrect() : this._setIncorrect()
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

  _render = () => {
    [ [this.state.isCursor, 'cursor'],
      [this.state.isCursorAfter, 'cursor-after'],
      [this.state.isSpace, 'space'],
      [this.state.isCorrect, 'correct'],
      [this.state.isIncorrect, 'incorrect']
    ].forEach(([b, c]) => {
      if (b) {
        this.classList().add(c)
      } else {
        this.classList().remove(c)
      }
    })

    this.setInnerHTML(this.state.currentChar)
  }
}
