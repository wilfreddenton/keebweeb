import { axisBottom, axisLeft, axisRight, scaleLinear, create, area, line, curveMonotoneX, format, max, min } from 'd3'

import { EventEntry, EventReset, listen } from '../events'

import { EntryType, isUndefined } from '../utils'

import Component from './component'

export default class Chart extends Component {
  constructor(element) {
    super(element, {
      width: 800,
      height: 300,
      wpm: 0,
      wpms: [],
      errors: [],
      wpmYMin: 0,
      wpmYMax: 0,
      wpmXMax: 1,
      errorYMax: 0
    }, {
      _timeStart: null,
      _numEntries: -1,
      _numErrors: 0
    })

    this._setupListeners()
  }

  _setupListeners() {
    listen(EventEntry, ({type, wpm, time}) => {
      if (this._timeStart === null) this._timeStart = time

      const _removeTracer = (wpms) => {
        if (wpms.length < 1) return wpms
        const wpm = wpms[wpms.length - 1]
        if (!isUndefined(wpm.tracer)) return wpms.slice(0, wpms.length - 1)
        return wpms
      }
      const totalElapsedFlaot = (time - this._timeStart) / 1000
      const totalElapsed = Math.floor(totalElapsedFlaot)
      const currentWpms = _removeTracer(this.state.wpms)
      const prevElapsed = currentWpms.length
      const diff = totalElapsed - prevElapsed

      if (diff > 0) {
        const wpms = []
        const snapWpm = this._numEntries * 12
        const errors = this._numErrors > 0 ? [{time: prevElapsed + 1, numErrors: this._numErrors}] : []
        for (let i = 1; i <= diff; i += 1) {
          const elapsed = time - this._timeStart
          const newElapsed = (prevElapsed + i) * 1000
          const adjustedWpm = wpm * (elapsed / newElapsed)
          wpms.push({
            snapWpm: i === 1 ? snapWpm : 0,
            wpm: adjustedWpm,
            time: prevElapsed + i
          })
        }
        this.setState({
          wpms: [..._removeTracer(this.state.wpms), ...wpms, {wpm, snapWpm: this._numEntries * 12, time: totalElapsedFlaot, tracer: true}],
          errors: this.state.errors.concat(errors),
          wpmXMax: totalElapsedFlaot,
          wpmYMin: this.state.wpmYMin === 0 && this.state.wpmYMax === 0
            ? Math.min(min(wpms, ({wpm, snapWpm}) => wpm < snapWpm ? wpm : snapWpm))
            : Math.min(min(wpms, ({wpm, snapWpm}) => wpm < snapWpm ? wpm : snapWpm), this.state.wpmYMin),
          wpmYMax: Math.max(max(wpms, ({wpm, snapWpm}) => wpm > snapWpm ? wpm : snapWpm), this.state.wpmYMax),
          errorYMax: Math.max(this.state.errorYMax, this._numErrors)
        })
        this._numEntries = 0
        this._numErrors = 0
      } else {
        this.setState({
          wpms: [..._removeTracer(this.state.wpms), {wpm, snapWpm: this._numEntries * 12, time: totalElapsedFlaot, tracer: true}],
          wpmXMax: totalElapsedFlaot
        })
      }

      switch (type) {
        case EntryType.correct:
          this._numEntries += 1
          break
        case EntryType.incorrect:
          this._numErrors += 1
          break
      }
    })
    listen(EventReset, this.reset.bind(this))
    this.onResize(this.state.width, width => this.setState({width, height: width / 2.67}))
  }

  reset() {
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
      top: Math.round(0.05 * height),
      right: Math.round(0.1 * width),
      bottom: Math.round(0.15 * height),
      left: Math.round(0.1 * width)
    })
    const wpms = this.state.wpms
    const errors = this.state.errors
    const wpmXMax = this.state.wpmXMax
    const wpmYMin = 0//this.state.wpmYMin
    const _wpmYMax = () => {
      const max = this.state.wpmYMax
      if (max <= 100) return 100
      if (max <= 150) return 150
      return max
    }
    const wpmYMax = _wpmYMax()
    const errorYMax = this.state.errorYMax

    const x = scaleLinear()
      .domain([1, wpmXMax])
      .range([0, width - margin.right - margin.left])
    const y = scaleLinear()
      .domain([wpmYMin, wpmYMax])
      .range([height - margin.top - margin.bottom, 0])
    const y1 = scaleLinear()
      .domain([0, errorYMax])
      .range([height - margin.top - margin.bottom, 0])

    const xAxis = () => axisBottom(x).tickValues(x.ticks().filter(Number.isInteger)).tickFormat(format('d'))
    const yAxis = () => axisLeft(y).ticks(3)
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
      //.append('text')
      //  .classed('axis-label', true)
      //  .text('Seconds')
      //  .attr('x', (width - margin.left - margin.right) / 2)
      //  .attr('y', margin.bottom)
    chart.append('g')
      .classed('axis', true)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(yAxis().tickFormat(format('d')))
      //.append('text')
      //  .classed('axis-label', true)
      //  .text('WPM')
      //  .attr('transform', 'rotate(-90)')
      //  .attr('x', -((height - margin.top - margin.bottom) / 2))
      //  .attr('y', -margin.left / 1.3)
    chart.append('g')
      .classed('axis', true)
      .attr('transform', `translate(${width-margin.right}, ${margin.top})`)
      .call(y1Axis().tickFormat(format('d')))
      //.append('text')
      //  .classed('axis-label', true)
      //  .text('Errors')
      //  .attr('transform', 'rotate(90)')
      //  .attr('x', ((height - margin.top - margin.bottom) / 2))
      //  .attr('y', -margin.right / 1.3)

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
