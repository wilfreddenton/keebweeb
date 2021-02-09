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
    `Freedom, isn't something earned through suffering or pushing yourself. You must accept yourself just as you are and live according to the flow of things; that is true freedom.`,
    `Whatever you lose, you'll find it again. But what you throw away you'll never get back.`,
    `That's all it is: information. Even a simulated experience or a dream; simultaneous reality and fantasy. Any way you look at it, all the information that a person accumulates in a lifetime is just a drop in the bucket.`,
    `Maybe, just maybe, it's a concept that's similar to a zero in mathematics. In other words, it's a symbol that denies the absence of meaning, the meaning that's necessitated by the delineation of one system from another. In analog, that's God. In digital, that's zero.`,
    `There are two things that collectors always want. The first is an item of extreme rarity. The second is colleagues to whom they can brag about their collection.`,
    `If you want to get to know someone, find out what makes them angry.`,
    `An apology is a promise to do things differently next time, and to keep the promise.`,
    `You should enjoy the little detours to the fullest. Because that's where you'll find things more important than what you want.`,
    `It takes a mere second for treasure to turn to trash.`,
    `I was trying to take the easy way out by running away from everything. No matter the pain, I will keep living. So when I die, I'll feel I did the best I could.`,
    `Whenever humans encounter the unknown, they tend to lose perspective.`,
    `Netero, forty-six years old, in the dead of winter. Sensing that he had reached his limits of both body and technique, he spent much time in contemplation before he reached an answer--Gratitude.`,
    `When Netero came down from the mountains, his fists were faster than sound.`
  ].map(t => new Text(t))

  new Fade(2000)
  new Select(document.getElementById('themes'), ['80082 Blu', 'Awaken', 'Cyberspace', 'Mecha', 'Muted', 'Superuser'], 4, 'theme')
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

main()
