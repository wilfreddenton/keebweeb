import { Fade } from '../utils.js'

export default class Select extends Fade {
  constructor(element, labels, defaultIndex, prefix) {
    super(element)

    this._options = labels.map(t => ({label: t, value: `${prefix}--${t.toLowerCase().replace(' ', '-')}`}))
    this._prefix = prefix
    this._defaultIndex = defaultIndex

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
    this.addEventListener('change', e => {
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
    this.element().value = selected
  }

  _render() {
    this.setInnerHTML(this._options.reduce((html, {label, value}) => {
      return `${html}<option value="${value}">${label}</option>\n`
    }, ''))

    this._updateSelected(this._getSelected() === null ? this._options[this._defaultIndex].value : this._getSelected())
  }
}
