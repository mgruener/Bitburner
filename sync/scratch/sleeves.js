import {
    SleeveArmy,
} from "lib/sleeves.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    const army = new SleeveArmy(ns)
    const sleeves = {}
    army.forAllSleeves(function (army, id) {
        sleeves[id] = army.setToCommitCrime("Heist", "testscript")
        if (sleeves[id] == null) {
            army.ns.tprintf("Fail: %i", id)
        } else {
            army.ns.tprintf("Sucecss: %i", id)
        }
    })

    let claim = army.setToCommitCrime("Shoplift", "testscript")
    if (claim == null) {
        ns.tprintf("Failed to send another sleeve shoplifting")
    }
    sleeves["3"].release()
    claim = army.setToCommitCrime("Shoplift", "testscript")
    if (claim == null) {
        ns.tprintf("Failed to send another sleeve shoplifting again")
    } else {
        ns.tprintf("Send sleeve %s shopliftig", claim.id)
    }

    Object.values(sleeves).forEach(claim => {
        claim.release()
    })
}