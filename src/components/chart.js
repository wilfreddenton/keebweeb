import { axisBottom, axisLeft, scaleLinear, create, line, max, curveMonotoneX } from 'd3'

import { EventEntry, EventReset, listen } from '../events'

import Component from './component'

export default class Chart extends Component {
  constructor(element) {
    super(element, {
      data: []
    }, {
      _timeStart: null
    })

    this._setupListeners()
  }

  _setupListeners() {
    listen(EventEntry, ({wpm, raw, time}) => {
      if (this._timeStart === null) this._timeStart = time
      this.setState({data: [...this.state.data, {wpm, raw, time: (time - this._timeStart) / 1000}]})
    })
    listen(EventReset, this.reset.bind(this))
  }

  reset() {
    super.reset()
    this.setState({data: []})
  }

  render() {
    const margin = Object.freeze({
      top: 30,
      right: 30,
      bottom: 30,
      left: 30
    })
    const data = this.state.data
    const x = scaleLinear()
      .domain([0, Math.ceil(max(data, ({time}) => time))])
      .range([0, 800 - margin.right - margin.left])
    const y = scaleLinear()
      .domain([0, max(data, ({wpm}) => wpm) + 10])
      .range([300 - margin.top - margin.bottom, 0])
    const wpmVsTime = line()
      .curve(curveMonotoneX)
      .x(({time}) => x(time))
      .y(({wpm}) => y(wpm))
    //const rawVsTime = line()
    //  .curve(curveMonotoneX)
    //  .x(({time}) => x(time))
    //  .y(({raw}) => y(raw))
    const svg = create('svg').attr('viewBox', '0 0 800 300')
    svg.append('path')
      .attr('transform', `translate(${margin.left}, ${margin.bottom})`)
      .attr('stroke', 'black')
      .attr('stroke-width', '1.5')
      .attr('stroke-miterlimit', '1')
      .attr('fill', 'none')
      .attr('d', wpmVsTime(data))
    //svg.append('path')
    //  .attr('transform', `translate(${margin.left}, ${margin.bottom})`)
    //  .attr('stroke', 'red')
    //  .attr('stroke-width', '1.5')
    //  .attr('stroke-miterlimit', '1')
    //  .attr('fill', 'none')
    //  .attr('d', rawVsTime(data))
    svg.append('g')
      .attr('transform', `translate(${margin.left}, ${300 - margin.bottom})`)
      .call(axisBottom(x))
    svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(axisLeft(y))
    svg.append('g')
      .selectAll('point')
      .data(data)
      .enter()
      .append('circle')
        .attr('transform', `translate(${margin.left}, ${margin.bottom})`)
        .attr('cx', ({time}) => x(time))
        .attr('cy', ({wpm}) => y(wpm))
        .attr('r', 3)
        .attr('fill', 'black')
    this.setInnerHTML('')
    this.appendChild(svg.node())
  }
}
