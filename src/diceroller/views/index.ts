import * as wecco from "@weccoframework/core"
import { appShell } from "../../common/components/appShell"
import { Message, RollDie } from "../controller"
import { m } from "../../common/i18n"
import { Model } from "../models"

export function root({model, emit}: wecco.ViewContext<Model, Message>): wecco.ElementUpdate {
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
                                <button class="btn btn-dark d${die}" @click=${()=> emit(new
                                    RollDie(die))}>${m("diceRoller.btn", die)}</button>
                            </div>
                            `)}
                            
                            ${history(model, emit)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `

    return appShell(body)
}

function history (model: Model, emit: wecco.MessageEmitter<Message>): wecco.ElementUpdate {
    if (model.history.length === 0) {
        return ""
    }

    const aggregatedHistory = model.aggregatedHistory

    const pool = model.availableDice
        .map(dt => [aggregatedHistory.countOfDie(dt), dt])
        .filter(c => c[0] > 0)
        .map(c => `${c[0]}${m("diceRoller.btn", c[1])}`)
        .join("+")

    return wecco.html`
    <h2 class="mt-5">${m("diceRoller.history")}</h2>
    <div>
        ${pool} = <strong>${aggregatedHistory.sum}</strong> 
        <a href="#" class="btn btn-outline-danger" @click=${() => emit("clearHistory")}>Clear</a>
    </div>
    <ul class="list-unstyled">
        ${model.history.map(r => wecco.html`<li><span class="badge text-bg-primary">${m("diceRoller.btn", r.dieType)}</span>: ${r.result}</li>`)}
    </ul>
    `
}