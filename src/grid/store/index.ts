import { GameGrid, GameGridInfo } from "../models/models"

const LocalStorageKey = "game-grids"

interface GameGridInfoDto {
    id: string
    lastUpdate: string
    label: string
    dimension: string
}

interface GameGridDto extends GameGridInfoDto {
    label: string
    descriptor: string
}

export function deleteGameGrid(id: string): Promise<void> {
    try {
        const s = localStorage.getItem(LocalStorageKey) ?? "[]"
        const grids = JSON.parse(s) as Array<GameGridDto>
        const index = grids.findIndex(g => g.id === id)
        if (index < 0) {
            return Promise.resolve()
        }
        grids.splice(index, 1)
        localStorage.setItem(LocalStorageKey, JSON.stringify(grids))
        return Promise.resolve()
    } catch (e) {
        return Promise.reject(e)
    }    
}

export function loadGameGrid (id: string): Promise<GameGrid> {
    try {
        const s = localStorage.getItem(LocalStorageKey) ?? "[]"
        const grids = JSON.parse(s) as Array<GameGridDto>
        for (const grid of grids) {
            if (grid.id === id) {
                return Promise.resolve(GameGrid.fromDescriptor(grid.id, grid.label, grid.descriptor))
            }
        }

        return Promise.reject("not found")
    } catch (e) {
        return Promise.reject(e)
    }        
}

export function loadSummaries(): Promise<Array<GameGridInfo>> {
    try {
        const s = localStorage.getItem(LocalStorageKey) ?? "[]"
        const dtos = JSON.parse(s) as Array<GameGridInfoDto>

        return Promise.resolve(dtos.map(dto => new GameGridInfo(dto.id, new Date(dto.lastUpdate), dto.label, dto.dimension)))
    } catch (e) {
        return Promise.reject(e)
    }
}

export function saveGameGrid (gameGrid: GameGrid): Promise<void> {
    const dto: GameGridDto = {
        id: gameGrid.id,
        label: gameGrid.label,
        lastUpdate: new Date().toISOString(),
        dimension: `${gameGrid.cols}x${gameGrid.rows}`,
        descriptor: gameGrid.descriptor,
    }

    try {
        const s = localStorage.getItem(LocalStorageKey) ?? "[]"
        let grids = JSON.parse(s) as Array<GameGridDto>
        let found = false
        for (let i = 0; i < grids.length; i++) {
            if (grids[i].id === gameGrid.id) {
                grids[i] = dto
                found = true
                break
            }
        }

        if (!found) {
            grids = [dto].concat(grids)            
        }
        localStorage.setItem(LocalStorageKey, JSON.stringify(grids))
        return Promise.resolve()
    } catch (e) {
        return Promise.reject(e)
    }
}