import './scss/index.scss'

import {
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
  new Select(document.getElementById('themes'), ['80082 BL00', 'Botanical', 'Granite', 'Muted', 'Nautilus', 'Superuser'], 1, 'theme')
  new Progress(document.getElementById('progress'))
  new TextBox(document.getElementById('text-box'))
  new Chart(document.getElementById('chart'))

  const randomTextIndex = () => Math.floor(Math.random() * texts.length)

  const getParams = () => {
    const params = new URLSearchParams(window.location.search)
    return {
      index: params.has('index') ? parseInt(params.get('index')) : null,
      text: params.has('text') ? params.get('text') : null,
      repeat: params.has('repeat') ? parseInt(params.get('repeat')): null
    }
  }

  const goToText = (i) => {
    history.pushState({index: i}, 'KeebWeeb', `?index=${i}`)
  }

  const resetHandler = () => {
    const { index, text, repeat } = getParams()
    let outputText = text
    let t = ''
    if (text !== null) {
      if (repeat != null) {
        for (let i = 1; i < repeat; i += 1) {
          outputText += ` ${text}`
        }
      }
      t = new Text(outputText)
    } else if (index != null) {
      t = texts[index]
    } else {
      const i = randomTextIndex()
      t = texts[i]
      goToText(i)
    }
    emit(EventReset, {text: t})
  }
  window.onpopstate = resetHandler

  listen(EventNext, () => {
    const { index } = getParams()
    let i = index
    while (i === index) i = randomTextIndex()
    goToText(i)
    emit(EventReset, {text: texts[i]})
  })

  resetHandler()
}

window.onload = main
