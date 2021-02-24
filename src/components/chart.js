import { axisBottom, axisLeft, axisRight, scaleLinear, create, area, line, curveMonotoneX, format, max, zoom } from 'd3'

import { EventEntry, EventReset, listen } from '../events'

import { EntryType, isUndefined } from '../utils'

import Component from './component'

export default class Chart extends Component {
  constructor(element) {
    super(element, {
      width: 800,
      height: 300,
      wpms: [],
      errors: [],
      wpmYMax: 0,
      wpmXMax: 1,
      errorYMax: 0
    }, {
      _timeStart: null,
      _snapshot: [],
      _numErrors: 0
    })

    this._setupListeners()
  }

  _setupListeners() {
    listen(EventEntry, this._entryHandler.bind(this))
    listen(EventReset, this.reset.bind(this))
    this.onResize(this.state.width, width => this.setState({
      width,
      height: width * this.state.height / this.state.width
    }))
  }

  _entryHandler({type, time, wpm}) {
    if (this._timeStart === null) this._timeStart = time

    switch (type) {
      case EntryType.correct:
        this._snapshot.push(time)
        break
      case EntryType.incorrect:
        this._numErrors += 1
        break
    }

    let i = 0
    while (i < this._snapshot.length) {
      if (time - this._snapshot[i] <= 1000) break
      i += 1
    }
    this._snapshot = this._snapshot.slice(i)

    const _removeTracer = (wpms) => {
      if (wpms.length < 1) return wpms
      const wpm = wpms[wpms.length - 1]
      if (!isUndefined(wpm.tracer)) return wpms.slice(0, wpms.length - 1)
      return wpms
    }
    const totalElapsedFloat = (time - this._timeStart) / 1000
    const totalElapsed = Math.floor(totalElapsedFloat)
    const currentWpms = _removeTracer(this.state.wpms)
    const prevElapsed = Math.max(0, currentWpms.length - 1)
    const snapWpm = this._snapshot.length * 12
    const diff = totalElapsed - prevElapsed

    if (diff > 0) {
      const wpms = []
      const errors = this._numErrors > 0 ? [{time: prevElapsed + 1, numErrors: this._numErrors}] : []
      for (let i = 1; i <= diff; i += 1) {
        const elapsed = time - this._timeStart
        const newElapsed = (prevElapsed + i) * 1000
        const adjustedWpm = Math.floor(wpm * (elapsed / newElapsed))
        wpms.push({
          snapWpm: i === 1 ? snapWpm : 0,
          wpm: adjustedWpm,
          time: prevElapsed + i
        })
      }
      this.setState({
        wpms: [...currentWpms, ...wpms, {wpm, snapWpm: snapWpm, time: totalElapsedFloat, tracer: true}],
        errors: this.state.errors.concat(errors),
        wpmXMax: totalElapsedFloat,
        wpmYMax: Math.max(max(wpms, ({wpm, snapWpm}) => wpm > snapWpm ? wpm : snapWpm), this.state.wpmYMax, wpm),
        errorYMax: Math.max(this.state.errorYMax, this._numErrors)
      })
      this._numErrors = 0
    } else {
      if (totalElapsedFloat === 0) {
        this.setState({wpms: [{wpm: 0, snapWpm: 0, time: 0}]})
      } else {
        this.setState({
          wpms: [..._removeTracer(this.state.wpms), {wpm, snapWpm, time: totalElapsedFloat, tracer: true}],
          wpmXMax: totalElapsedFloat,
          wpmYMax: Math.max(this.state.wpmYMax, wpm, snapWpm)
        })
      }
    }
  }

  reset() {
    super.reset()
    this.setState({
      wpms: [],
      errors: [],
      wpmXMax: 0,
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
    const wpmYMin = 0
    const wpmYMax = Math.max(100, this.state.wpmYMax)
    const errorYMax = this.state.errorYMax

    const x = scaleLinear()
      .domain([0, Math.max(1, wpmXMax)])
      .range([0, width - margin.right - margin.left])
    const y = scaleLinear()
      .domain([wpmYMin, wpmYMax])
      .range([height - margin.top - margin.bottom, 0])
    const y1 = scaleLinear()
      .domain([0, Math.max(1, errorYMax)])
      .range([height - margin.top - margin.bottom, 0])

    const newXAxis = x => axisBottom(x).tickValues(x.ticks().filter(Number.isInteger)).tickFormat(format('d'))
    const newYAxis = y => axisLeft(y).ticks(5).tickFormat(format('d'))
    const newY1Axis = y => axisRight(y).tickValues(y.ticks().filter(Number.isInteger)).tickFormat(format('d'))

    const wpmVsTimeLine = (wpms, x) => line()
      .curve(curveMonotoneX)
      .x(({time}) => x(time))
      .y(({wpm}) => y(wpm))
      (wpms)
    const wpmVsTimeArea = (wpms, x) => area()
      .curve(curveMonotoneX)
      .x(({time}) => x(time))
      .y0(y(wpmYMin))
      .y1(({wpm}) => y(wpm))
      (wpms)

    const snapWpmVsTimeLine = (wpms, x) => line()
      .curve(curveMonotoneX)
      .x(({time}) => x(time))
      .y(({snapWpm}) => y(snapWpm))
      (wpms)
    const snapWpmVsTimeArea = (wpms, x) => area()
      .curve(curveMonotoneX)
      .x(({time}) => x(time))
      .y0(y(wpmYMin))
      .y1(({snapWpm}) => y(snapWpm))
      (wpms)

    const chart = create('svg')
      .classed('chart', true)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')

    

    const gridXAxis = (g, x) => g.call(newXAxis(x).tickSize(-height + margin.top + margin.bottom).tickFormat(''))
    const gridYAxis = (g, y) => g.call(newYAxis(y).tickSize(-width + margin.right + margin.left).tickFormat(''))
    const gridX = chart.append('g')
      .classed('grid', true)
      .attr('transform', `translate(${margin.left}, ${height - margin.bottom})`)
      .call(gridXAxis, x)
    chart.append('g')
      .classed('grid', true)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(gridYAxis, y)

    const bottomLeftTransform = (g, k) => g.attr('transform', `translate(${margin.left * k}, ${margin.top})`)
    const clip = { id: 'clip', href: 'url(#clip)' }
    chart.append('clipPath')
      .attr('id', clip.id)
      .append('rect')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', width - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom);

    const lineGroup = chart.append('g')
      .attr('clip-path', clip.href)

    const lineSnap = lineGroup.append('path')
      .classed('line-snap-wpm', true)
      .attr('stroke-width', '1.5')
      .attr('stroke-miterlimit', '1')
      .attr('d', snapWpmVsTimeLine(wpms, x))
      .call(bottomLeftTransform, 1)
    const areaSnap = lineGroup.append('path')
      .classed('area-snap-wpm', true)
      .attr('d', snapWpmVsTimeArea(wpms, x))
      .call(bottomLeftTransform, 1)

    const lineWpm = lineGroup.append('path')
      .classed('line-wpm', true)
      .attr('stroke-width', '1.5')
      .attr('stroke-miterlimit', '1')
      .attr('d', wpmVsTimeLine(wpms, x))
      .call(bottomLeftTransform, 1)
    const areaWpm = lineGroup.append('path')
      .classed('area-wpm', true)
      .attr('d', wpmVsTimeArea(wpms, x))
      .call(bottomLeftTransform, 1)

    const xAxis = (g, x) => g.call(newXAxis(x))
    const yAxis = (g, y) => g.call(newYAxis(y))
    const y1Axis = (g, y) => g.call(newY1Axis(y))
    const lineXAxis = chart.append('g')
      .classed('axis', true)
      .attr('transform', `translate(${margin.left}, ${height - margin.bottom})`)
      .call(xAxis, x)
    chart.append('g')
      .classed('axis', true)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(yAxis, y)
    chart.append('g')
      .classed('axis', true)
      .attr('transform', `translate(${width-margin.right}, ${margin.top})`)
      .call(y1Axis, y1)

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

    chart.call(zoom()
      .scaleExtent([1, 5])
      .extent([[margin.left, 0], [width - margin.right, height]])
      .translateExtent([[margin.left, -Infinity], [width - margin.right, Infinity]])
      .on('zoom', ({transform}) => {
        const { k } = transform
        const dx = transform.rescaleX(x)
        gridX.call(gridXAxis, dx)

        lineSnap
          .attr('d', snapWpmVsTimeLine(wpms, dx))
          .call(bottomLeftTransform, k)
        areaSnap
          .attr('d', snapWpmVsTimeArea(wpms, dx))
          .call(bottomLeftTransform, k)

        lineWpm
          .attr('d', wpmVsTimeLine(wpms, dx))
          .call(bottomLeftTransform, k)
        areaWpm
          .attr('d', wpmVsTimeArea(wpms, dx))
          .call(bottomLeftTransform, k)

        lineXAxis.call(xAxis, dx)
      })
    )

    this.replaceInner(chart.node())
  }
}
