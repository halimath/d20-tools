export type Language = string
export type Messages = {[key:string]: string}

export interface MessageLoader {
    loadMessages (language: Language): Promise<Messages | undefined>
    loadDefaultMessages(): Promise<Messages>
}

export class StaticMessageLoader implements MessageLoader {
    constructor(private readonly defaultMessages: Messages, private readonly messagesByLanguage: {[key:string]: Messages}) {}

    loadDefaultMessages(): Promise<Messages> {
        return Promise.resolve(this.defaultMessages)
    }

    loadMessages(language: Language): Promise<Messages | undefined> {
        return Promise.resolve(this.messagesByLanguage[language])
    }
}

export class MessageResolver {
    static async create (loader: MessageLoader, language?: Language): Promise<MessageResolver> {
        const lang = language ?? determineNavigatorLanguage()
        const [defaultMessages, localizedMessages] = await Promise.all([loader.loadDefaultMessages(), loader.loadMessages(lang)])
        return new MessageResolver(defaultMessages, localizedMessages)
    }

    constructor (private readonly defaultMessages: Messages, private readonly localizedMessages?: Messages) {}

    mpl(key: string, amount: number, ...args: Array<unknown>): string {
        if (amount === 1) {
            return this.m(`${key}.1`)
        }
    
        return this.m(`${key}.n`, ...args).replace(/%d/g, `${amount}`)
    }
    
    m(key: string, ...args: Array<unknown>): string {
        let msg = (this.localizedMessages ? this.localizedMessages[key] : undefined) ?? this.defaultMessages[key] ?? `Undefined key: ${key}`
    
        for (let i = 0; i < args.length; i++) {
            msg = msg.replace(`{{${i}}}`, `${args[i]}`)
        }
    
        return msg
    }    
}

export function determineNavigatorLanguage (): Language {
    if (navigator.languages && navigator.language.length > 0) {
        return extractLanguageFromLocale(navigator.languages[0])
    } else if (navigator.language) {
        return extractLanguageFromLocale(navigator.language)
    }

    return "en"
}

function extractLanguageFromLocale(locale: string): Language {
    return locale.substr(0, 2).toLowerCase()
}