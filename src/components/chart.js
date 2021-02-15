import { axisBottom, axisLeft, scaleLinear, create, area, line, min, max, curveMonotoneX } from 'd3'

import { EventComplete, EventEntry, EventReset, listen } from '../events'

import Component from './component'

export default class Chart extends Component {
  constructor(element) {
    super(element, {
      data: []
    }, {
      _entry: null,
      _interval: null
    })

    this._setupListeners()
  }

  _setupListeners() {
    listen(EventEntry, ({wpm}) => {
      if (this._entry === null) {
        this._interval = setInterval(() => {
          this.setState({data: [...this.state.data, this._entry]})
        }, 1000)
      }
      this._entry = {wpm, time: this.state.data.length + 1}
    })
    listen(EventComplete, () => clearInterval(this._interval))
    listen(EventReset, this.reset.bind(this))
  }

  reset() {
    clearInterval(this._interval)
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
    const yMin = min(data, ({wpm}) => wpm)
    const x = scaleLinear()
      .domain(data.length > 0 ? [1, data.length] : [])
      .range([0, 800 - margin.right - margin.left])
    const y = scaleLinear()
      .domain([yMin, max(data, ({wpm}) => wpm)])
      .range([300 - margin.top - margin.bottom, 0])
    const wpmVsTimeLine = line()
      .curve(curveMonotoneX)
      .x(({time}) => x(time))
      .y(({wpm}) => y(wpm))
    const wpmVsTimeArea = area()
      .curve(curveMonotoneX)
      .x(({time}) => x(time))
      .y0(y(yMin))
      .y1(({wpm}) => y(wpm))
    const svg = create('svg').attr('viewBox', '0 0 800 300')
    svg.append('path')
      .classed('line-wpm', true)
      .attr('transform', `translate(${margin.left}, ${margin.bottom})`)
      .attr('stroke-width', '1.5')
      .attr('stroke-miterlimit', '1')
      .attr('d', wpmVsTimeLine(data))
    svg.append('path')
      .classed('area-wpm', true)
      .attr('transform', `translate(${margin.left}, ${margin.bottom})`)
      .attr('stroke-width', '1.5')
      .attr('stroke-miterlimit', '1')
      .attr('d', wpmVsTimeArea(data))
    svg.append('g')
      .classed('axis', true)
      .attr('transform', `translate(${margin.left}, ${300 - margin.bottom})`)
      .call(axisBottom(x))
    svg.append('g')
      .classed('axis', true)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(axisLeft(y))
    svg.append('g')
      .selectAll('point')
      .data(data)
      .enter()
      .append('circle')
        .classed('point', true)
        .attr('transform', `translate(${margin.left}, ${margin.bottom})`)
        .attr('cx', ({time}) => x(time))
        .attr('cy', ({wpm}) => y(wpm))
        .attr('r', 3)
    this.setInnerHTML('')
    this.appendChild(svg.node())
  }
}
