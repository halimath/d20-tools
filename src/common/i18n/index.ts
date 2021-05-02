import * as i18n from "@weccoframework/i18n"

let messageResolver: i18n.MessageResolver

export const load = (): Promise<void> => 
    i18n.MessageResolver.create(new i18n.JsonMessageLoader(i18n.fetchJsonSource("/messages")))
        .then(mr => void (messageResolver = mr))

export function m (key: string, ...args: Array<unknown>): string {
    return messageResolver.m(key, ...args)
}        

export function mpl (key: string, amount: number, ...args: Array<unknown>): string {
    return messageResolver.mpl(key, amount, ...args)
}        
