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

function main() {
  const texts = [
    `There are two things that collectors always want. The first is an item of extreme rarity. The second is colleagues to whom they can brag about their collection.`,
    `People only find me interesting because they can't tell whether I'm serious or not.`,
    `Gon, you are light. But sometimes you shine so brightly, I must look away. Even so, is it still okay if I stay at your side?`,
    `If you want to get to know someone, find out what makes them angry.`,
    `It takes a mere second for treasure to turn to trash.`,
    `An apology is a promise to do things differently next time, and to keep the promise.`,
    `You should enjoy the little detours to the fullest. Because that's where you'll find things more important than what you want.`,
    `Assassination - Its the family trade. We all take it up. My folks see me as an exceptional prospect. But I don't see that I should have to live up to their expectations.`,
    `Normally, as people love and are loved, they feel happiness. When I am hated by people, that is when I feel happiness. And then I want to tear apart and inflict unimaginable harm to the things I love. But is that really all that strange, I wonder?`,
    `I’ve always gone to any lengths to avoid facing danger and risk, hiding myself within a safe cage, where no one could hurt me. I hated myself for it.. But I couldn’t change myself.. Friends and teachers encouraged me, but I never truly listened, considering it the logic of the strong. Yet somehow… A boy with less than half my strength managed to break my cage!`,
    `It takes a mere second for treasure to turn to trash.`,
    `Right now, I'm letting you live. And I'll continue to keep you alive... until you've grown enough to become worth killing.`,
    `There are liars who only lie when there's a reason to, and there are liars who also lie without a reason.`,
    `We are not desperate for help, we only seek the strong.`,
    `You believe I cannot pray with a single arm? A prayer comes from the heart. If the heart achieves the correct form, it becomes emotions and emotions can be manifested.`,
    `I was trying to take the easy way out by running away from everything. No matter the pain, I will keep living. So when I die, I'll feel I did the best I could.`,
    `Whenever humans encounter the unknown, they tend to lose perspective.`,
    `I do not fear death. I fear only that my rage will fade over time.`
  ]

  new Fade(2000)
  new Select(document.getElementById('themes'), ['80082 Blu', 'Awaken', 'Cyberspace', 'Mecha', 'Muted', 'Superuser'], 4, 'theme')
  new WPM(document.getElementById('wpm'))
  new Accuracy(document.getElementById('accuracy'))
  new Progress(document.getElementById('progress'))
  new TextBox(document.getElementById('text-box'))

  const resetHandler = () => {
    const params = new URLSearchParams(window.location.search)
    const i = params.has('index') ? params.get('index') : Math.floor(Math.random() * texts.length)
    emit(EventReset, {text: texts[i]})
  }
  window.onpopstate = resetHandler
  listen(EventStop, () => {
    const i = Math.floor(Math.random() * texts.length)
    history.pushState({index: i}, 'KeebWeeb', `?index=${i}`)
    emit(EventReset, {text: texts[i]})
  })

  resetHandler()
}

main()
