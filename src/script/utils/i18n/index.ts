import * as messages_en from "./messages-en.json"
import * as messages_de from "./messages-de.json"

type Lang = "en" | "de"
type MessagesMap = {[key:string]: string}

const Messages: {[key:string]: MessagesMap} = {
    en: messages_en,
    de: messages_de,
}

const DefaultLanguage = "en"

export function mpl(key: string, amount: number): string {
    if (amount === 1) {
        return m(`${key}.1`)
    }

    return m(`${key}.n`).replace(/%d/g, `${amount}`)
}

export function m(key: string): string {
    const messages = Messages[determineLanguage() as Lang]
    const defaultMessages = Messages[DefaultLanguage]

    return messages[key] ?? defaultMessages[key] ?? `Undefined key: ${key}`
}

function determineLanguage (): string {
    let candiate = ""

    if (navigator.languages && navigator.language.length > 0) {
        candiate = extractLanguageFromLocale(navigator.languages[0])
    } else if (navigator.language) {
        candiate = extractLanguageFromLocale(navigator.language)
    }

    if (candiate in Messages) {
        return candiate
    }

    return DefaultLanguage
}

function extractLanguageFromLocale(locale: string): string {
    return locale.substr(0, 2).toLowerCase()
}