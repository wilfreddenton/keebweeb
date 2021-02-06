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
    this._setupListeners()
  }

  _setupListeners() {
    listen(EventProgress, ({ index, length }) => {
      this.setState({progress: Math.floor((index / length) * 100)})
    })
    listen(EventReset, () => {
      this.setState(Progress.initialState)
    })
  }

  render() {
    this.setInnerHTML(`Progress: ${this.state.progress}%`)
  }
}
