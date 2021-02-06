import Fade from './fade'

export default class Select extends Fade {
  constructor(element, labels, defaultIndex, prefix) {
    super(element)

    this._prefix = prefix

    this.state = {selected: this._getSelected()}
    this.stateChangeHandlers = [this._updateSelected]

    const options = labels.map(t => ({label: t, value: `${prefix}--${t.toLowerCase().replace(' ', '-')}`}))
    if (this.state.selected === null) {
      this.setState({selected: options[defaultIndex].value})
    }

    this._setupListeners()
    this._render(options)
    this._updateSelected()
  }

  _setupListeners() {
    this.addEventListener('change', e => {
      this.setState({selected: e.target.value})
    })
  }

  _render(options) {
    this.setInnerHTML(options.reduce((html, {label, value}) => {
      return `${html}<option value="${value}">${label}</option>\n`
    }, ''))
  }

  _getSelected() {
    return localStorage.getItem(`${this._prefix}--selected`)
  }

  _setSelected(selected) {
    window.localStorage.setItem(`${this._prefix}--selected`, selected)
  }

  _updateSelected = () => {
    const {selected} = this.state
    document.body.classList = ""
    document.body.classList.add(selected)
    this._setSelected(selected)
    this.setValue(selected)
  }
}
