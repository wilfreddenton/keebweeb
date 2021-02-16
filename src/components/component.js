export default class Component {
  constructor(element, state, initialRefs) {
    this._element = element
    this.state = {...state}
    this._initialRefs = initialRefs
    Object.assign(this, this._initialRefs)

    this.render()
  }

  setState(newState) {
    const prevState = { ...this.state }
    this.state = { ...prevState, ...newState }
    this.render(prevState)
  }

  reset() {
    Object.assign(this, this._initialRefs)
  }

  render() {}

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
    if (element instanceof Component) element = element._element
    this._element.parentNode.insertBefore(element, this._element)
  }

  insertAfter(element) {
    if (element instanceof Component) element = element._element
    this._element.parentNode.insertBefore(element, this._element.nextSibling)
  }

  addEventListener(event, f) {
    return this._element.addEventListener(event, f)
  }

  adjacentSiblings() {
    return [this._element.previousSibling, this._element.nextSibling]
  }

  appendChild(element) {
    if (element instanceof Component) element = element._element
    this._element.appendChild(element)
  }

  offsetTop() {
    return this._element.offsetTop
  }

  replaceInner(node) {
    if (this._element.firstChild === null) {
      this.appendChild(node)
    } else {
      this._element.firstChild.replaceWith(node)
    }
  }
}
