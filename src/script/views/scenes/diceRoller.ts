import * as wecco from "@wecco/core"
import { Message, RollDie } from "../../controller"
import { DiceRoller } from "../../models"
import { appShell } from "../components/appShell"

export function diceRoller(context: wecco.AppContext<Message>, model: DiceRoller): wecco.ElementUpdate {
    const body = wecco.html`
        <div class="container dice-roller">
            <div class="row">
                <div class="col mt-4 text-center roll ${model.roll ? "" : " invisible"}">
                    <p class="result">${model.roll?.result ?? "0"}</p>
                    <p class="lead">Result of rolling a D<span id="die">${model.roll?.dieType ?? "0"}</span></p>
                </div>
            </div>
            <div class="row">
                ${model.availableDice.map(die => wecco.html`
                <div class="col mt-2 text-center">
                    <button class="btn btn-dark d${die}" @click=${()=> context.emit(new
                        RollDie(die))}>D${die}</button>
                </div>
                `)}
            </div>
        </div>
    `

    return appShell(context, body)
}
