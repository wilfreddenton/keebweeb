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
