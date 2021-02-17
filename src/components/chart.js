import { axisBottom, axisLeft, axisRight, scaleLinear, create, area, line, curveMonotoneX, format } from 'd3'

import { EventComplete, EventEntry, EventReset, listen } from '../events'

import { EntryType } from '../utils'

import Component from './component'

export default class Chart extends Component {
  constructor(element) {
    super(element, {
      width: 800,
      height: 300,
      wpms: [],
      errors: [],
      seconds: [],
      wpmYMin: 0,
      wpmYMax: 0,
      errorYMax: 0
    }, {
      _entry: null,
      _interval: null,
      _numEntries: 0,
      _numErrors: 0
    })

    this._setupListeners()
  }

  _setupListeners() {
    listen(EventEntry, ({type, wpm}) => {
      if (this._entry === null) {
        this._interval = setInterval(() => {
          const time = this.state.wpms.length + 1
          const snapWpm = this._numEntries * 12
          this.setState({
            wpms: [...this.state.wpms, {time, snapWpm, wpm: this._entry}],
            errors: this.state.errors.concat(this._numErrors > 0 ? [{time, numErrors: this._numErrors}] : []),
            wpmYMin: this.state.wpmYMin === 0 && this.state.wpmYMax === 0
              ? Math.min(this._entry, snapWpm)
              : Math.min(this.state.wpmYMin, this._entry, snapWpm),
            wpmYMax: Math.max(this.state.wpmYMax, this._entry, snapWpm),
            errorYMax: Math.max(this.state.errorYMax, this._numErrors)
          })
          this._numEntries = 0
          this._numErrors = 0
        }, 1000)
      }
      this._entry = wpm
      switch (type) {
        case EntryType.correct:
          this._numEntries += 1
          break
        case EntryType.incorrect:
          this._numErrors += 1
          break
      }
    })
    listen(EventComplete, () => clearInterval(this._interval))
    listen(EventReset, this.reset.bind(this))
    this.onResize(this.state.width, width => { this.setState({width, height: width / 2.67})})
  }

  reset() {
    clearInterval(this._interval)
    super.reset()
    this.setState({
      wpms: [],
      errors: [],
      wpmYMin: 0,
      wpmYMax: 0,
      errorYMax: 0
    })
  }

  render() {
    const width = this.state.width
    const height = this.state.height
    const margin = Object.freeze({
      top: 30,
      right: 30,
      bottom: 30,
      left: 30
    })
    const wpms = this.state.wpms
    const errors = this.state.errors
    const wpmYMin = this.state.wpmYMin
    const wpmYMax = this.state.wpmYMax
    const errorYMax = this.state.errorYMax

    const x = scaleLinear()
      .domain(wpms.length > 0 ? [1, wpms.length] : [1, 1])
      .range([0, width - margin.right - margin.left])
    const y = scaleLinear()
      .domain([wpmYMin, wpmYMax])
      .range([height - margin.top - margin.bottom, 0])
    const y1 = scaleLinear()
      .domain([0, errorYMax])
      .range([height - margin.top - margin.bottom, 0])

    const xAxis = () => axisBottom(x).tickValues(x.ticks().filter(Number.isInteger)).tickFormat(format('d'))
    const yAxis = () => axisLeft(y).ticks(5)
    const y1Axis = () => axisRight(y1).tickValues(y1.ticks().filter(Number.isInteger)).tickFormat(format('d'))

    const wpmVsTimeLine = line()
      .curve(curveMonotoneX)
      .x(({time}) => x(time))
      .y(({wpm}) => y(wpm))
    const wpmVsTimeArea = area()
      .curve(curveMonotoneX)
      .x(({time}) => x(time))
      .y0(y(wpmYMin))
      .y1(({wpm}) => y(wpm))

    const snapWpmVsTimeLine = line()
      .curve(curveMonotoneX)
      .x(({time}) => x(time))
      .y(({snapWpm}) => y(snapWpm))
    const snapWpmVsTimeArea = area()
      .curve(curveMonotoneX)
      .x(({time}) => x(time))
      .y0(y(wpmYMin))
      .y1(({snapWpm}) => y(snapWpm))

    const chart = create('svg')
      .classed('chart', true)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')

    chart.append('g')
      .classed('grid', true)
      .attr('transform', `translate(${margin.left}, ${height - margin.bottom})`)
      .call(xAxis().tickSize(-height + margin.top + margin.bottom).tickFormat(''))
    chart.append('g')
      .classed('grid', true)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(yAxis().tickSize(-width + margin.right + margin.left).tickFormat(''))

    chart.append('path')
      .classed('line-wpm', true)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .attr('stroke-width', '1.5')
      .attr('stroke-miterlimit', '1')
      .attr('d', wpmVsTimeLine(wpms))
    chart.append('path')
      .classed('area-wpm', true)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .attr('d', wpmVsTimeArea(wpms))

    chart.append('path')
      .classed('line-snap-wpm', true)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .attr('stroke-width', '1.5')
      .attr('stroke-miterlimit', '1')
      .attr('d', snapWpmVsTimeLine(wpms))
    chart.append('path')
      .classed('area-snap-wpm', true)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .attr('d', snapWpmVsTimeArea(wpms))

    chart.append('g')
      .classed('axis', true)
      .attr('transform', `translate(${margin.left}, ${height - margin.bottom})`)
      .call(xAxis().tickFormat(format('d')))
      .append('text')
        .classed('axis-label', true)
        .text('Seconds')
        .attr('x', (width - margin.left - margin.right) / 2)
        .attr('y', margin.bottom)
    chart.append('g')
      .classed('axis', true)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(yAxis().tickFormat(format('d')))
      .append('text')
        .classed('axis-label', true)
        .text('WPM')
        .attr('transform', 'rotate(-90)')
        .attr('x', -((height - margin.top - margin.bottom) / 2))
        .attr('y', 0)
    chart.append('g')
      .classed('axis', true)
      .attr('transform', `translate(${width-margin.right}, ${margin.top})`)
      .call(y1Axis().tickFormat(format('d')))
      .append('text')
        .classed('axis-label', true)
        .text('Errors')
        .attr('transform', 'rotate(90)')
        .attr('x', ((height - margin.top - margin.bottom) / 2))
        .attr('y', 0)

    chart.append('g')
      .selectAll('point')
      .data(wpms)
      .enter()
      .append('circle')
        .classed('point', true)
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .attr('cx', ({time}) => x(time))
        .attr('cy', ({wpm}) => y(wpm))
        .attr('r', 4)

    chart.append('g')
      .selectAll('point-error')
      .data(errors)
      .enter()
      .append('circle')
        .classed('point-error', true)
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .attr('cx', ({time}) => x(time))
        .attr('cy', ({numErrors}) => y1(numErrors))
        .attr('r', 4)

    this.replaceInner(chart.node())
  }
}
