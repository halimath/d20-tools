import * as wecco from "@wecco/core"
import { version } from "../../../package.json"
import { m } from "./i18n"
import { modal, ModalHandle } from "./modal"

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
                    <li class="nav-item"><a class="nav-link" href="/grid">${m("nav.gameGrid")}</a></li>
                    <!-- <li class="nav-item"><a class="nav-link" href="/foes">${m("nav.foes")}</a></li> -->
                </ul>
                <ul class="navbar-nav me-auto">                    
                    <li class="nav-item"><a class="nav-link" @click=${()=> aboutDialog.show()}>${m("nav.about")}</a></li>
                    <li class="nav-item"><a class="nav-link" href="https://github.com/halimath/d20-tools">${m("nav.source")}</a></li>                            
                </ul>
            </div>
        </nav>
        
        <main>
            ${main}
        </main>
    
        ${modal(wecco.html`<p>${m("about.version", version)}</p><p>${m("about.copyright")}</p>`, {
            title: m("about.title"),
            actions: [
                wecco.html`<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${m("about.close")}</button>`,
            ],
            onCreate: m => aboutDialog = m,
        })}
    `
}
