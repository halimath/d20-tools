import * as wecco from "@weccoframework/core"
import { load } from "src/common/i18n"
import { lastPathElement, setLastPathElement } from "../common/browser"
import { GridRemoteUpdate, update } from "./controller/controller"
import "./index.sass"
import { DefaultZoomLevel, Editor, GameGrid, Viewer } from "./models/models"
import { root } from "./views"
import { loadGrid, subscribeForGrid, updateGrid } from "./api/api"
import { isAuthenticated, sendLoginRedirect } from "d20-tools/common/components/auth"


document.addEventListener("DOMContentLoaded", async () => {
    await load()

    const svgStencils = document.createElement("div")
    svgStencils.classList.add("hidden")
    document.body.appendChild(svgStencils)
    wecco.updateElement(svgStencils, wecco.html`
        <svg aria-hidden="true" class="svg-stencil"
            xmlns="http://www.w3.org/2000/svg" id="svg-defs">
            <symbol id="wall-top-wall">
                <path d="M 0 0 l 10 0" />
            </symbol>

            <symbol id="background" viewbox="0 0 10 10">
                <path d="M 2 3 L 3 2 M 2 5 L 5 2 M 2 7 L 7 2 M 3 8 L 8 3 M 5 8 L 8 5 M 7 8 L 8 7" />
            </symbol>
        </svg>
    `)
       
    wecco.createApp(async ({emit}) => {
        const route = lastPathElement()
        if (!route) {
            // No route: start editing a blank grid
            return new Editor(GameGrid.createInitial())
        }
                    
        if (route.startsWith("edit:")) {
            // An edit:<id> route - start editing this grid

            // First see if the user is logged in. If not redirect her to
            // login
            if (!isAuthenticated()) {
                sendLoginRedirect()
                return
            }

            // User is authenticated - load the grid and start an editor
            const id = route.substring("edit:".length)
            try {
                const g = await loadGrid(id)
                // Loading is allowed to anyone - grids can be viewed publicly.
                // The next update request is to test if the user is authorized
                // to edit this grid.
                try {
                    await updateGrid(g)
                    return new Editor(await loadGrid(id))
                } catch (e) {
                    // User does not seem to be the owner of this grid. Use the
                    // descriptor and start editing a fresh copy.
                    console.error(e)
                    setLastPathElement(g.descriptor)
                    return new Editor(GameGrid.fromDescriptor(g.label, g.descriptor))
                }
            } catch (err) {
                console.error(err)
                setLastPathElement("")
                return new Editor(GameGrid.createInitial())
            }
        }

        if (route.startsWith("view:")) {
            // An view:<id> route - start viewing this grid
            const id = route.substring("view:".length)
            const subscription = subscribeForGrid(id, grid => {
                try {
                    emit(new GridRemoteUpdate(grid))
                } catch (e) {
                    console.error(`Error parsing grid descriptor received via SSE: ${e}`)
                }
            })
            document.addEventListener("beforeunload", () => {
                subscription.cancel()
            })
            return new Viewer(GameGrid.createInitial(), DefaultZoomLevel)
        }

        try {
            // Test if the route is a grid descriptor and use this one -
            // anonymous editing.
            const gg = GameGrid.fromDescriptor("", route)
            return new Editor(gg, DefaultZoomLevel)
        } catch (e) {            
            // Some invalid route. Just ignore and start with an empty grid
            console.error(e)
            setLastPathElement("")
            return new Editor(GameGrid.createInitial())
        }

    }, update, root).mount("#app")    
})
