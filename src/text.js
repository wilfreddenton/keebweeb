export default class Text {
  constructor(text) {
    if (text instanceof Text) text = text._text
    this._text = text.trim()
  }

  charAt(i) {
    return this._text[i]
  }

  length() {
    return this._text.length
  }
}
