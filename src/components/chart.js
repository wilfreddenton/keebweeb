import { axisBottom, axisLeft, axisRight, scaleLinear, create, area, line, min, max, curveMonotoneX, format } from 'd3'

import { EventComplete, EventEntry, EventReset, listen } from '../events'

import { EntryType } from '../utils'

import Component from './component'

export default class Chart extends Component {
  constructor(element) {
    super(element, {
      entries: [],
      errors: []
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
          this.setState({
            entries: [...this.state.entries, {...this._entry, snapWpm: this._numEntries * 12}],
            errors: this.state.errors.concat(this._numErrors > 0 ? [{ numErrors: this._numErrors, time: this.state.entries.length + 1 }] : [])
          })
          this._numEntries = 0
          this._numErrors = 0
        }, 1000)
      }
      this._entry = {wpm, time: this.state.entries.length + 1}
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
  }

  reset() {
    clearInterval(this._interval)
    super.reset()
    this.setState({entries: [], errors: []})
  }

  render() {
    const width = 800
    const height = 300
    const margin = Object.freeze({
      top: 30,
      right: 30,
      bottom: 30,
      left: 30
    })
    const entries = this.state.entries
    const errors = this.state.errors
    const yMin = min(entries, ({wpm, snapWpm}) => wpm < snapWpm ? wpm : snapWpm)
    const yMax = max(entries, ({wpm, snapWpm}) => wpm > snapWpm ? wpm : snapWpm)

    const x = scaleLinear()
      .domain(entries.length > 0 ? [1, entries.length] : [])
      .range([0, width - margin.right - margin.left])
    const y = scaleLinear()
      .domain([yMin, yMax])
      .range([height - margin.top - margin.bottom, 0])
    const y1 = scaleLinear()
      .domain([0, max(errors, ({numErrors}) => numErrors)])
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
      .y0(y(yMin))
      .y1(({wpm}) => y(wpm))

    const snapWpmVsTimeLine = line()
      .curve(curveMonotoneX)
      .x(({time}) => x(time))
      .y(({snapWpm}) => y(snapWpm))
    const snapWpmVsTimeArea = area()
      .curve(curveMonotoneX)
      .x(({time}) => x(time))
      .y0(y(yMin))
      .y1(({snapWpm}) => y(snapWpm))

    const chart = create('svg')
      .classed('chart', true)
      .attr('viewBox', `0 0 ${width} ${height}`)

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
      .attr('transform', `translate(${margin.left}, ${margin.bottom})`)
      .attr('stroke-width', '1.5')
      .attr('stroke-miterlimit', '1')
      .attr('d', wpmVsTimeLine(entries))
    chart.append('path')
      .classed('area-wpm', true)
      .attr('transform', `translate(${margin.left}, ${margin.bottom})`)
      .attr('d', wpmVsTimeArea(entries))

    chart.append('path')
      .classed('line-snap-wpm', true)
      .attr('transform', `translate(${margin.left}, ${margin.bottom})`)
      .attr('stroke-width', '1.5')
      .attr('stroke-miterlimit', '1')
      .attr('d', snapWpmVsTimeLine(entries))
    chart.append('path')
      .classed('area-snap-wpm', true)
      .attr('transform', `translate(${margin.left}, ${margin.bottom})`)
      .attr('d', snapWpmVsTimeArea(entries))

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
      .data(entries)
      .enter()
      .append('circle')
        .classed('point', true)
        .attr('transform', `translate(${margin.left}, ${margin.bottom})`)
        .attr('cx', ({time}) => x(time))
        .attr('cy', ({wpm}) => y(wpm))
        .attr('r', 3)

    chart.append('g')
      .selectAll('point-error')
      .data(errors)
      .enter()
      .append('circle')
        .classed('point-error', true)
        .attr('transform', `translate(${margin.left}, ${margin.bottom})`)
        .attr('cx', ({time}) => x(time))
        .attr('cy', ({numErrors}) => y1(numErrors))
        .attr('r', 3)

    this.replaceInner(chart.node())
  }
}
