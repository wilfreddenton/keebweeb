export default class Component {
  constructor(element) {
    this._element = element
    this.state = {}
    this.stateChangeHandlers = []
  }

  setState(delta) {
    this.state = {...this.state, ...delta}
    this.stateChangeHandlers.forEach(h => h())
  }

  getInnerHTML() {
    return this._element.innerHTML
  }

  setInnerHTML(html) {
    this._element.innerHTML = html
  }

  setValue(v) {
    this._element.value = v
  }

  style() {
    return this._element.style
  }

  classList() {
    return this._element.classList
  }

  remove() {
    this._element.remove()
  }

  insertBefore(element) {
    this._element.parentNode.insertBefore(element, this._element)
  }

  insertAfter(element) {
    this._element.parentNode.insertBefore(element, this._element.nextSibling)
  }

  addEventListener(event, f) {
    return this._element.addEventListener(event, f)
  }

  adjacentSiblings() {
    return [this._element.previousSibling, this._element.nextSibling]
  }

  appendChild(child) {
    if (child instanceof Component) child = child._element
    this._element.appendChild(child)
  }

  offsetTop() {
    return this._element.offsetTop
  }
}
