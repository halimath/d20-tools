import * as wecco from "@wecco/core"
import { m } from "src/script/utils/i18n"
import { Message, ShowDiceRoller, ShowGameGrid } from "../../controller"


export function appShell(context: wecco.AppContext<Message>, main: wecco.ElementUpdate): wecco.ElementUpdate {
    return wecco.html`
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <span class="navbar-brand">
                <img src="/icon.png" alt="Logo" width="48">
                ${m("nav.title")}
            </span>
            <ul class="navbar-nav me-auto flex-grow-1">
                <li class="nav-item"><a class="nav-link" @click=${() => context.emit(new ShowDiceRoller())}>${m("nav.diceRoller")}</a></li>
                <li class="nav-item"><a class="nav-link" @click=${() => context.emit(new ShowGameGrid())}>${m("nav.gameGrid")}</a></li>
            </ul>
            <ul class="navbar-nav me-auto">
                <li class="nav-item"><a class="nav-link" href="https://github.com/halimath/d20-tools">${m("nav.source")}</a></li>
            </ul>
        </div>
    </nav>

    ${main}
    `
}
