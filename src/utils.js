function isUndefined(v) {
  return typeof v === 'undefined'
}

function debounce(f, ms) {
  let timeout = null
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      f(...args)
    }, ms)
  }
}

function getRootFontSize() {
  return parseInt(window.getComputedStyle(document.documentElement).fontSize.match(/\d+/)[0])
}

function getLineHeightRem(element, fontSize) {
  return Math.floor(parseInt(window.getComputedStyle(element).lineHeight.slice(0, -2)) / fontSize)
}

function getNumLines(element, lineHeightPx) {
  return Math.floor(element.offsetHeight / lineHeightPx)
}

export { debounce, getLineHeightRem, getNumLines, getRootFontSize, isUndefined }
