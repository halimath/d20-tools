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

export class MergingMessageLoader implements MessageLoader {
    private readonly loaders: Array<MessageLoader>
    
    constructor (...loaders: Array<MessageLoader>) {
        if (loaders.length < 2) {
            throw `Invalid number of loaders to merge: ${loaders.length}`
        }
        this.loaders = loaders
    }

    async loadDefaultMessages(): Promise<Messages> {
        return this.mergeMessages(this.loaders.map(l => l.loadDefaultMessages()))
    }

    loadMessages(language: Language): Promise<Messages | undefined> {
        return this.mergeMessages(this.loaders.map(l => l.loadMessages(language)))
    }

    private async mergeMessages (input: Array<Promise<Messages | undefined>>): Promise<Messages> {
        const loaded = await Promise.all(input)
        const msg = loaded[0] ?? {}
        loaded.slice(1).forEach(m => {
            if (!m) {
                return
            }
            Object.keys(m).forEach(k => {
                if (typeof msg[k] === "undefined") {
                    msg[k] = m[k]
                }
            })
        })

        return msg
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