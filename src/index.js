import './scss/index.scss'

import {
  EventStop,
  EventReset,
  emit,
  listen
} from './events'

import {
  Accuracy,
  Progress,
  Select,
  TextBox,
  WPM
} from './components'

import Fade from './fade'
import Text from './text'

function main() {
  const texts = [
    `There are two things that collectors always want. The first is an item of extreme rarity. The second is colleagues to whom they can brag about their collection.`,
    `An apology is a promise to do things differently next time, and to keep the promise.`,
    `It takes a mere second for treasure to turn to trash.`,
    `I was trying to take the easy way out by running away from everything. No matter the pain, I will keep living. So when I die, I'll feel I did the best I could.`,
    `Whenever humans encounter the unknown, they tend to lose perspective.`,
    `Sensing he had reached his limits of both body and technique, he spent much time contemplating before he reached an answer--Gratitude.`,
    `When Netero came down from the mountains, his fists were faster than sound.`
  ].map(t => new Text(t))

  new Fade(2000)
  new Select(document.getElementById('themes'), ['80082 Blu', 'Awaken', 'Bliss', 'Cyberspace', 'Mecha', 'Muted', 'Superuser'], 5, 'theme')
  new WPM(document.getElementById('wpm'))
  new Accuracy(document.getElementById('accuracy'))
  new Progress(document.getElementById('progress'))
  new TextBox(document.getElementById('text-box'))

  const randomText = () => Math.floor(Math.random() * texts.length)

  const getIndex = () => {
    const params = new URLSearchParams(window.location.search)
    return params.has('index') ? parseInt(params.get('index')) : -1
  }

  const goToText = (i) => {
    history.pushState({index: i}, 'KeebWeeb', `?index=${i}`)
  }

  const resetHandler = () => {
    const j = getIndex()
    const i = j < 0 ? randomText() : j
    goToText(i)
    emit(EventReset, {text: texts[i]})
  }
  window.onpopstate = resetHandler

  listen(EventStop, () => {
    const j = getIndex()
    let i = j
    while (i === j) i = randomText()
    goToText(i)
    emit(EventReset, {text: texts[i]})
  })

  resetHandler()
}

window.onload = main
