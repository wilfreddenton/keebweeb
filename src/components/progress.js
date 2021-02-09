import {
  EventProgress,
  EventReset,
  listen
} from '../events'

import Component from './component'

export default class Progress extends Component {
  static initialState = {index: 0, length: 0}

  constructor(element) {
    super(element, Progress.initialState)

    this._progress = 0

    this._setupListeners()
  }

  _setupListeners() {
    listen(EventProgress, ({index}) => this.setState({index}))
    listen(EventReset, ({text}) => {
      this.setState({index: 0, length: text.length()})
    })
  }

  render() {
    this._progress = Math.floor((this.state.index / this.state.length) * 100)
    this.setInnerHTML(`Progress: ${this._progress}%`)
  }
}
