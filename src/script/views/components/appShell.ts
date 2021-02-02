// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./bootstrap.d.ts" />

import * as wecco from "@wecco/core"
import { GameGrid } from "src/script/models"
import { m } from "src/script/utils/i18n"
import { Message, ShowDiceRoller, ShowGameGrid } from "../../controller"
import { version } from "../../../../package.json"

export function appShell(context: wecco.AppContext<Message>, main: wecco.ElementUpdate): wecco.ElementUpdate {
    return wecco.html`
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
            <div class="container">
                <span class="navbar-brand">
                    <img src="/icon.png" alt="Logo" width="48">
                    ${m("nav.title")}
                </span>
                <ul class="navbar-nav me-auto flex-grow-1">
                    <li class="nav-item"><a class="nav-link" @click=${()=> context.emit(new
                            ShowDiceRoller())}>${m("nav.diceRoller")}</a></li>
                    <li class="nav-item"><a class="nav-link" @click=${()=> context.emit(new ShowGameGrid(GameGrid.createInitial()))}>${m("nav.gameGrid")}</a></li>
                </ul>
                <ul class="navbar-nav me-auto">                    
                    <li class="nav-item"><a class="nav-link" @click=${()=> new bootstrap.Modal(document.querySelector(".modal"),
                            {}).show()}>${m("nav.about")}</a></li>
                    <li class="nav-item"><a class="nav-link" href="https://github.com/halimath/d20-tools">${m("nav.source")}</a></li>                            
                </ul>
            </div>
        </nav>
        
        ${main}
        
        <div class="modal fade" id="about-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${m("about.title")}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>
                            ${m("about.version", version)}
                        </p>
                        <p>
                            ${m("about.copyright")}
                        </p>                        
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${m("about.close")}</button>
                    </div>
                </div>
            </div>
        </div>
    `
}
