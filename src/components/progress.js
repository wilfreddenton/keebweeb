import {
  EventProgress,
  EventReset,
  listen
} from '../events'

import Component from './component'

export default class Progress extends Component {
  static initialState = {progress: 0}

  constructor(element) {
    super(element, Progress.initialState)

    this._length = 0

    this._setupListeners()
  }

  _setupListeners() {
    listen(EventReset, ({text}) => {
      this._length = text.length()
      this.setState(Progress.initialState)
    })
    listen(EventProgress, ({index}) => this.setState({
      progress: this._length > 0 ? Math.floor((index / this._length) * 100) : 0
    }))
  }

  render() {
    this.setInnerHTML(`Progress: ${this.state.progress}%`)
  }
}
