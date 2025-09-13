import * as wecco from "@weccoframework/core"
import { versionLabel } from "../../../package.json"
import { m } from "../i18n"
import { modal, ModalHandle } from "./modal-deprecated"

export function appShell(main: wecco.ElementUpdate): wecco.ElementUpdate {
    let aboutDialog: ModalHandle

    return wecco.html`
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
            <div class="container">
                <span class="navbar-brand">
                    <img src="/icon.png" alt="Logo" width="48">
                    ${m("nav.title")}
                </span>
                <ul class="navbar-nav me-auto flex-grow-1">
                    <li class="nav-item"><a class="nav-link" href="/">${m("nav.diceRoller")}</a></li>
                    <li class="nav-item"><a class="nav-link" href="/grid/">${m("nav.gameGrid")}</a></li>
                    <li class="nav-item"><a class="nav-link" href="/foes/">${m("nav.foes")}</a></li>
                </ul>
                <ul class="navbar-nav me-auto">                    
                    <li class="nav-item"><a class="nav-link" @click=${()=> aboutDialog.show()}>${m("nav.about")}</a></li>                    
                </ul>
            </div>
        </nav>
        
        <main>
            ${main}
        </main>
    
        ${modal(wecco.html`
            <div class="modal-header">
                <h5 class="modal-title">${m("about.title")}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>${m("about.version", versionLabel)}</p>
                <p>${m("about.copyright")}</p>
                <p><a href="https://github.com/halimath/d20-tools">https://github.com/halimath/d20-tools</a></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${m("close")}</button>
            </div>`, {
                binder: m => aboutDialog = m,            
        })}
    `
}
