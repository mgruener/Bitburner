import {
    SleeveArmy,
} from "lib/sleeves.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    const army = new SleeveArmy(ns)
    const sleeves = {}
    army.forAllSleeves(function (army, id) {
        const claim = army.setToCommitCrime("Heist", "testscript")
        if (claim) {
            sleeves[id] = claim
            army.ns.tprintf("Success: %i", id)
        } else {
            army.ns.tprintf("Fail: %i", id)
        }
    })


    Object.values(sleeves).forEach(claim => {
        claim.release()
    })
}