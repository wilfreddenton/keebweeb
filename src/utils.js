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

export { debounce, getRootFontSize, isUndefined }
