import * as wecco from "@weccoframework/core"
import { m } from "../i18n"

interface ActiveLogin {
    name: string
}

declare global {
    interface Window {
        _activeLogin?: ActiveLogin
    }
}

export function isAuthenticated(): boolean {
    return !!window._activeLogin
}

export function sendLoginRedirect () {
    const loginUrl = `/auth/login?r=${encodeURIComponent(document.location.pathname)}`
    document.location.href = loginUrl
}

export function sendLogoutRedirect () {
    document.location.href = "/auth/logout"
}

export function loginLogoutLink(): wecco.ElementUpdate {
    if (isAuthenticated()) {

        return wecco.html`<a href="#" class="nav-link" @click+preventDefault+stopPropagation=${sendLogoutRedirect}><span class="material-icons">account_circle</span></a>`
    }


    return wecco.html`<a href="#" class="nav-link" @click+preventDefault+stopPropagation=${sendLoginRedirect}>${m("login")}</a>`
}