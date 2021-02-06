import { isUndefined } from '../utils'

import Component from './component'

export default class Select extends Component {
  constructor(element, labels, defaultIndex, prefix) {
    super(element)

    const options = labels.map(t => ({label: t, value: `${prefix}--${t.toLowerCase().replace(' ', '-')}`}))
    const selected = localStorage.getItem(`${prefix}--selected`)
    this.state = {
      options: options,
      prefix: prefix,
      selected: selected === null ? options[defaultIndex].value : selected
    }
    this._setupListeners()
  }

  _setupListeners() {
    this.addEventListener('change', e => {
      this.setState({selected: e.target.value})
    })
  }

  render(prevState) {
    const { selected } = this.state
    document.body.classList = ""
    document.body.classList.add(selected)

    if (isUndefined(prevState)) {
      this.setInnerHTML(this.state.options.reduce((html, {label, value}) => {
        return `${html}<option value="${value}">${label}</option>\n`
      }, ''))
    } else {
      localStorage.setItem(`${this.state.prefix}--selected`, selected)
    }
    
    this.setValue(selected)
  }
}
