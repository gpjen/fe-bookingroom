import id from './id'
import en from './en'
import zh from './zh'

export type Messages = Record<string, string>

export function getMessages(lang: 'id' | 'en' | 'zh'): Messages {
  switch (lang) {
    case 'en':
      return en
    case 'zh':
      return zh
    default:
      return id
  }
}

