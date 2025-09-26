import { expect } from "chai"

import { GameGrid, Token } from "d20-tools/grid/models/index"

describe("Token", () => {
    describe("fromUrlHash", () => {
        it("should parse valid hash", () => {
            let got = Token.fromUrlHash("pb")
            expect(got).to.not.eq(undefined)
            got = got!
            expect(got.symbol).to.eq("♙")
            expect(got.color).to.eq("blue")
        })
    })
})


describe("GameGrid", () => {
    describe("fromDescriptor", () => {
        describe("should parse example descriptor", () => {
            const gameGrid = GameGrid.fromDescriptor("1", "test", "30:20/-10e4-586/pb1pg1pr1po1pp1-1pk1kk1-592/-30le1-1le1-1de1-1165")

            it("should have id set", () => {
                expect(gameGrid.id).to.eq("1")
            })

            it("should have label set", () => {
                expect(gameGrid.label).to.eq("test")
            })

            it("should have dimension set", () => {
                expect(gameGrid.cols).to.eq(30)
                expect(gameGrid.rows).to.eq(20)
            })

            describe("should have background set at ", () => {
                for (let c = 0; c < 30; c++) {
                    for (let r = 0; r < 20; r++) {
                        ((c, r) => {
                            it(`(${c}, ${r})`, () => {
                                const color = gameGrid.backgroundAt(c, r)
                                if (r === 0 && [10, 11, 12, 13].includes(c)) {
                                    expect(color, `color at ${r}:${c}`).to.eq("grey")
                                } else {
                                    expect(color, `color at ${r}:${c}`).to.eq(undefined)
                                    
                                }
                            })
                        })(c, r)
                    }
                }
            })

            describe("should have tokens set at ", () => {
                it("(0, 0)", () => {
                    let token = gameGrid.tokenAt(0, 0)
                    expect(token).to.not.eq(undefined)
                    
                    token = token!
                    expect(token.color).to.eq("blue")
                    expect(token.symbol).to.eq("♙")
                })

                it("(1, 0)", () => {
                    let token = gameGrid.tokenAt(1, 0)
                    expect(token).to.not.eq(undefined)
                    
                    token = token!
                    expect(token.color).to.eq("green")
                    expect(token.symbol).to.eq("♙")
                })

                it("(5, 0)", () => {
                    const token = gameGrid.tokenAt(5, 0)
                    expect(token).to.eq(undefined)
                })

                it("(7, 0)", () => {
                    let token = gameGrid.tokenAt(7, 0)
                    expect(token).to.not.eq(undefined)
                    
                    token = token!
                    expect(token.color).to.eq("black")
                    expect(token.symbol).to.eq("♘")
                })

            })
        })
    })
})