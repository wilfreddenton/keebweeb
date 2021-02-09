import Component from './component'

class LinkedListNode extends Component {
  constructor(element, state) {
    super(element, state)

    this._index = 0
    this._prev = null
    this._next = null
  }

  index() {
    return this._index
  }

  setIndex(index) {
    this._index = index
  }

  next() {
    return this._next
  }

  prev() {
    return this._prev
  }

  insertBefore(node) {
    const prev = this._prev
    this._prev = node
    if (prev !== null) prev._next = node
    node._prev = prev
    node._next = this

    super.insertBefore(node)
  }

  insertAfter(node) {
    const next = this._next
    this._next = node
    if (next !== null) next._prev = node
    node._next = next
    node._prev = this

    super.insertAfter(node)
  }

  remove() {
    if (this._prev !== null) this._prev._next = this._next
    if (this._next !== null) this._next._prev = this._prev

    super.remove(this)
  }
}

class LinkedList extends Component {
  constructor(element, state) {
    super(element, {...state, length: 0})
    this._head = null
    this._tail = null
  }

  head() {
    return this._head
  }

  tail() {
    return this._tail
  }

  chop(node) {
    if (node === null) return
    this._tail = node._prev
    this._tail._next = null

    let count = 0
    while (node !== null) {
      node.remove()
      node = node._next
      count += 1
    }
    this.setState({length: this.state.length - count})
  }

  push(node) {
    if (this._head === null) {
      this._head = node
      this._tail = node
      this.appendChild(node)
    } else {
      this._tail.insertAfter(node)
      this._tail = node
    }
    this.setState({length: this.state.length + 1})
  }

  removeNode(node) {
    if (this._head === node) this._head = node._next
    if (this._tail === node) this._tail = node._prev
    node.remove()
    this.setState({length: this.state.length - 1})
  }

  insertNodeBefore(n1, n2) {
    n1.insertBefore(n2)
    if (n1 === this._head) this._head = n2
    this.setState({length: this.state.length + 1})
  }
}

export { LinkedList, LinkedListNode }
