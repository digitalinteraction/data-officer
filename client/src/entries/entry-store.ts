import { defineStore } from 'pinia'

export interface EntryStoreState {
  itemId: number
  submission: EntrySubmission
  reminder: null | number
}

export interface DiaryEntry {
  id: number
  created: Date
  response: {
    reminder: number | null
    items: DiaryItem[]
  }
  user: number
}

export interface EntrySubmission {
  sources: string[]
  items: DiaryItem[]
}

export interface DiaryItem {
  id: number
  source: string

  origin: string
  organisation: string
  description: string
  url: string
  when: string
  how: string
  reason: string

  trust: string // number in a string
  importance: string // number in a string
  feeling: string
  nextActions: string
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

function blankItem(id: number): DiaryItem {
  return {
    id: id,
    source: '',

    origin: '',
    organisation: '',
    description: '',
    url: '',
    when: '',
    how: '',
    reason: '',

    trust: '50',
    importance: '50',
    feeling: '',
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
    question: 'What online information have you consumed from messaging apps?',
  },
  {
    id: 'messaging',
    name: 'Messaging apps',
    label: 'Mobile messaging apps',
    question: 'What online information have you consumed from social media?',
  },
]

export function getSourceName(id: string) {
  const source = entrySources.find((s) => s.id === id)
  return source?.name ?? id
}

export const useEntryStore = defineStore('entry', {
  state: (): EntryStoreState => ({
    itemId: 1,
    submission: blankSubmission(),
    reminder: null,
  }),
  actions: {
    addItem(source: string) {
      this.submission.items.push({
        ...blankItem(this.itemId++),
        source: source,
      })
    },
    removeItem(item: DiaryItem) {
      this.submission.items = this.submission.items.filter((i) => i !== item)
    },
    resetSubmission() {
      this.itemId = 0
      this.submission = blankSubmission()
    },
  },
})
