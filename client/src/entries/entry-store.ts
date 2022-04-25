import { defineStore } from 'pinia'

export interface DiaryItem {
  source: string

  origin: string
  organisation: string
  description: string
  url: string
  when: string

  trust: number
  importance: number
  feeling: unknown
  nextActions: string
}

export interface EntrySubmission {
  sources: string[]
  items: DiaryItem[]
}

export interface EntryStore {
  submission: EntrySubmission
}

export interface NewsSource {
  id: string
  name: string
  label: string
  question: string
}

function blankSubmission(): EntrySubmission {
  return {
    sources: [],
    items: [],
  }
}

function blankItem(): DiaryItem {
  return {
    source: '',

    origin: '',
    organisation: '',
    description: '',
    url: '',
    when: '',

    trust: 0.5,
    importance: 0.5,
    feeling: null,
    nextActions: '',
  }
}

export const entrySources: NewsSource[] = [
  {
    id: 'news-site',
    name: 'News',
    label: 'A news website',
    question: 'What online information have you consumed from news websites?',
  },
  {
    id: 'social-media',
    name: 'Social media',
    label: 'A social media platform',
    question: 'What online information have you access from social media?',
  },
  {
    id: 'messaging',
    name: 'Messaging apps',
    label: 'A social media platform',
    question: 'What online information have you recieved from messaging apps?',
  },
]

export const useEntryStore = defineStore('entry', {
  state: (): EntryStore => ({
    submission: blankSubmission(),
  }),
  actions: {
    addItem(source: string) {
      this.submission.items.push({
        ...blankItem(),
        source: source,
      })
    },
    removeItem(item: DiaryItem) {
      this.submission.items = this.submission.items.filter((i) => i !== item)
    },
  },
})
