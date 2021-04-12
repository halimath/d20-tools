import { MessageResolver, StaticMessageLoader } from "../../common/i18n"

import  * as messagesEn from "./messages-en.json"
import  * as messagesDe from "./messages-de.json"

let messageResolver: MessageResolver

(async () => {
    messageResolver = await MessageResolver.create(new StaticMessageLoader(
        messagesEn, { "en": messagesEn, "de": messagesDe}
    ))
})()

export function mpl(key: string, amount: number, ...args: Array<unknown>): string {
    return messageResolver.mpl(key, amount, ...args)
}

export function m(key: string, ...args: Array<unknown>): string {
    return messageResolver.m(key, ...args)
}