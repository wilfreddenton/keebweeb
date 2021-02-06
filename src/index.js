import './scss/index.scss'

import {
  EventStop,
  EventReset,
  emit,
  listen
} from './events'

import {
  Accuracy,
  Fade,
  Progress,
  Select,
  TextBox,
  WPM
} from './components'

function main() {
  const texts = [
    `Irrevocable commitment to any religion is not only intellectual suicide; it is positive unfaith because it closes the mind to any new vision of the world. Faith is, above all, open-ness--an act of trust in the unknown.`,
    `The wise man molds himself--the fool lives only to die.`,
    `Prophecy and prescience--How can they be put to the test in the face of the unanswered question? Consider: How much is actual prediction of the "wave form" (as Muad'Dib referred to his vision-image) and how much is the prophet shaping the future to fit the prophecy?`,
    `Expectations are the cause of all my problems.`,
    `If the ego is not regularly and repeatedly dissolved in the unbounded hyperspace of the Transcendent Other, there will always be slow drift away from the sense of self as part of nature's larger whole. The ultimate consequence of this drift is the fatal ennui that now permeates Western civilization.`,
    `If there are gods and they are just, then they will not care how devout you have been, but will welcome you based on the virtues you have lived by.`
  ]

  new Select(document.getElementById('themes'), ['80082 Blu', 'Awaken', 'Cyberspace', 'Mecha', 'Muted', 'Superuser'], 4, 'theme')
  new WPM(document.getElementById('wpm'))
  new Accuracy(document.getElementById('accuracy'))
  new Progress(document.getElementById('progress'))
  new Fade(document.getElementById('help'))
  new TextBox(document.getElementById('text-box'))

  let i = 0
  const resetHandler = () => {
    const params = new URLSearchParams(window.location.search)
    i = params.has('index') ? params.get('index') : 0
    emit(EventReset, {text: texts[i]})
  }
  window.onpopstate = resetHandler
  listen(EventStop, () => {
    i = (i + 1) % texts.length
    history.pushState({index: i}, 'KeebWeeb', `?index=${i}`)
    emit(EventReset, {text: texts[i]})
  })

  resetHandler()
}

main()
