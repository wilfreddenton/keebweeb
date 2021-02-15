import './scss/index.scss'

import {
  EventComplete,
  EventNext,
  EventReset,
  emit,
  listen
} from './events'

import {
  Chart,
  Progress,
  Select,
  TextBox,
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
    `When Netero came down from the mountains, his fists were faster than sound.`,
    `There is no way to train your heart to be invulnerable.`,
    `Words bend our thinking to infinite paths of self-delusion, and the fact that we spend most of our mental lives in brain mansions built of words means that we lack the objectivity necessary to see the terrible distortion of reality which language brings.`
  ].map(t => new Text(t))

  new Fade(2000)
  new Select(document.getElementById('themes'), ['80082 Blu', 'Awaken', 'Bliss', 'Cyberspace', 'Mecha', 'Muted', 'Superuser'], 5, 'theme')
  new Progress(document.getElementById('progress'))
  new TextBox(document.getElementById('text-box'))
  new Chart(document.getElementById('chart'))

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

  listen(EventNext, () => {
    const j = getIndex()
    let i = j
    while (i === j) i = randomText()
    goToText(i)
    emit(EventReset, {text: texts[i]})
  })

  listen(EventComplete, ({endState}) => {
    console.log(endState)
  })

  // WPM at entry
  // time of entry
  // character entered
  // isCorrect/isIncorrect (show character if incorrect)
  // was entry fixed
  // needs to show backspaces

  resetHandler()
}

window.onload = main
