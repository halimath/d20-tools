import * as wecco from "@wecco/core"
import { appShell } from "src/common/components/appShell"
import { m } from "src/common/i18n"
import { Message } from "../controller"
import { Model } from "../models"

export function root(model: Model, context: wecco.AppContext<Message>): wecco.ElementUpdate {
    const body = wecco.html`
        <div class="container mt-4">
            <div class="row">
                <div class="col">
                    <div class="card">                        
                        <div class="row card-img-top">
                            <div class="col text-center roll ${model.roll ? "" : " invisible"}">
                                <p class="result">${m("diceRoller.result.value", model.roll?.result ?? "0")}</p>
                                <p class="lead">${m("diceRoller.result.die", model.roll?.dieType ?? "0")}</span></p>
                            </div>
                        </div>
                        <div class="row card-body">                            
                            <h5 class="card-title">${m("diceRoller.title")}</h5>
                            <p class="card-text">${m("diceRoller.intro")}</p>
                            ${model.availableDice.map(die => wecco.html`
                            <div class="col mt-2 text-center">
                                <button class="btn btn-dark d${die}" @click=${()=> context.emit(new
                                    Message(die))}>${m("diceRoller.btn", die)}</button>
                            </div>
                            `)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `

    return appShell(body)
}