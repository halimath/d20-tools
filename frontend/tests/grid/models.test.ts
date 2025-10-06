import {expect, describe, test} from "@jest/globals"
import { GameGrid, Token } from "d20-tools/grid/models/models"

describe("Token", () => {
    describe("fromUrlHash", () => {
        test("should parse valid hash", () => {
            let got = Token.fromUrlHash("pb")
            expect(got).not.toBe(undefined)
            got = got!
            expect(got.symbol).toStrictEqual("♙")
            expect(got.color).toStrictEqual("blue")
        })
    })
})


describe("GameGrid", () => {
    describe("fromDescriptor", () => {
        describe("should parse example descriptor", () => {
            const gameGrid = GameGrid.fromDescriptor("1", "test", "30:20/-10e4-586/pb1pg1pr1po1pp1-1pk1kk1-592/-30le1-1le1-1de1-1165")

            test("should have id set", () => {
                expect(gameGrid.id).toStrictEqual("1")
            })

            test("should have label set", () => {
                expect(gameGrid.label).toStrictEqual("test")
            })

            test("should have dimension set", () => {
                expect(gameGrid.cols).toStrictEqual(30)
                expect(gameGrid.rows).toStrictEqual(20)
            })

            describe("should have background set at ", () => {
                for (let c = 0; c < 30; c++) {
                    for (let r = 0; r < 20; r++) {
                        ((c, r) => {
                            test(`(${c}, ${r})`, () => {
                                const color = gameGrid.backgroundAt(c, r)
                                if (r === 0 && [10, 11, 12, 13].includes(c)) {
                                    expect(color).toStrictEqual("grey")
                                } else {
                                    expect(color).toStrictEqual(undefined)
                                    
                                }
                            })
                        })(c, r)
                    }
                }
            })

            describe("should have tokens set at ", () => {
                test("(0, 0)", () => {
                    let token = gameGrid.tokenAt(0, 0)
                    expect(token).not.toBe(undefined)
                    
                    token = token!
                    expect(token.color).toStrictEqual("blue")
                    expect(token.symbol).toStrictEqual("♙")
                })

                test("(1, 0)", () => {
                    let token = gameGrid.tokenAt(1, 0)
                    expect(token).not.toBe(undefined)
                    
                    token = token!
                    expect(token.color).toStrictEqual("green")
                    expect(token.symbol).toStrictEqual("♙")
                })

                test("(5, 0)", () => {
                    const token = gameGrid.tokenAt(5, 0)
                    expect(token).toStrictEqual(undefined)
                })

                test("(7, 0)", () => {
                    let token = gameGrid.tokenAt(7, 0)
                    expect(token).not.toBe(undefined)
                    
                    token = token!
                    expect(token.color).toStrictEqual("black")
                    expect(token.symbol).toStrictEqual("♘")
                })

            })
        })
    })
})