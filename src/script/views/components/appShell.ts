import * as wecco from "@wecco/core"
import { Message, ShowDiceRoller, ShowGameGrid } from "../../controller"


export function appShell(context: wecco.AppContext<Message>, main: wecco.ElementUpdate): wecco.ElementUpdate {
    return wecco.html`
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <span class="navbar-brand">D20 Tools</span>
            <ul class="navbar-nav me-auto">
                <li class="nav-item"><a class="nav-link" @click=${() => context.emit(new ShowDiceRoller())}>Dice Roller</a></li>
                <li class="nav-item"><a class="nav-link" @click=${() => context.emit(new ShowGameGrid())}>Game Grid</a></li>
            </ul>
        </div>
    </nav>

    ${main}
    `
}
