import * as wecco from "@weccoframework/core"
import { m } from "../i18n"
import { modal } from "./modal"
import { loginLogoutLink } from "./auth"

export function appShell(main: wecco.ElementUpdate, activePage: "diceroller" | "grid" | "encounters"): wecco.ElementUpdate {
    return wecco.html`
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
            <div class="container">
                <span class="navbar-brand">
                    <img src="/icon.png" alt="Logo" width="48">
                    ${m("nav.title")}
                </span>
                <ul class="navbar-nav me-auto flex-grow-1">
                    <li class="nav-item"><a class="nav-link ${activePage === "diceroller" ? "active" : ""}" href="/">${m("nav.diceRoller")}</a></li>
                    <li class="nav-item"><a class="nav-link ${activePage === "grid" ? "active" : ""}" href="/grid/">${m("nav.gameGrid")}</a></li>
                    <li class="nav-item"><a class="nav-link ${activePage === "encounters" ? "active" : ""}" href="/encounters/">${m("nav.encounters")}</a></li>
                </ul>
                <ul class="navbar-nav me-auto">                    
                    <li class="nav-item"><a class="nav-link" @click=${()=> showAboutDialog()}>${m("nav.about")}</a></li>
                    <li class="nav-item">${loginLogoutLink()}</li>
                </ul>
            </div>
        </nav>
        
        <main>
            ${main}
        </main>    
    `
}

interface VersionInfo {
    version: string
    build_date: string
    vcs_ref: string
}

async function showAboutDialog () {
    const versionInfo = await fetch("/.well-known/version-info.json")
        .then(r => r.json())
        .catch(e => {
            console.error(`Error fetching version info: ${e}`)
            return {
                version: "unknown",
                build_date: new Date().toISOString(),
                vcs_ref: "unknown"
            }
        }) as VersionInfo

    modal(wecco.html`
            <div class="modal-header">
                <h5 class="modal-title">${m("about.title")}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="modal-body">
                <p>
                    Version ${versionInfo?.version ?? "local"}<br>
                    <small class="text-secondary"><code>${versionInfo.vcs_ref ?? "local"}</code>, built ${versionInfo.build_date ?? new Date().toISOString()}</small>
                </p>
                <p>${m("about.copyright")}</p>
                <p><a href="https://github.com/halimath/d20-tools">https://github.com/halimath/d20-tools</a></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${m("close")}</button>
            </div>`, {
                show: true,
        })
}
