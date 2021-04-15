import { MergingMessageLoader, MessageResolver, StaticMessageLoader } from "../../common/i18n"

import * as messagesEn from "./messages-en.json"
import * as messagesDe from "./messages-de.json"

import * as commonsMessagesEn from "../../common/components/i18n/messages-en.json"
import * as commonsMessagesDe from "../../common/components/i18n/messages-de.json"

let messageResolver: MessageResolver

(async () => {
    messageResolver = await MessageResolver.create(
        new MergingMessageLoader(
            new StaticMessageLoader(messagesEn, { "en": messagesEn, "de": messagesDe}),
            new StaticMessageLoader(commonsMessagesEn, { "en": commonsMessagesEn, "de": commonsMessagesDe}),
        )
    )
})()

export function mpl(key: string, amount: number, ...args: Array<unknown>): string {
    return messageResolver.mpl(key, amount, ...args)
}

export function m(key: string, ...args: Array<unknown>): string {
    return messageResolver.m(key, ...args)
}