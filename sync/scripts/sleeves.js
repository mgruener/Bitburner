/** @param {import("../..").NS } ns */

const api = ns.sleeve

const work = {
    "study": {
        "func": api.setToUniversityCourse,
        "multi": true,
    },
    "crime": {
        "func": api.setToCommitCrime,
        "multi": true,
    },
    "train": {
        "func": api.setToGymWorkout,
        "multi": true,
    },
    "company": {
        "func": api.setToCompanyWork,
        "multi": false,
    },
    "faction": {
        "func": api.setToFactionWork,
        "multi": false,
    },
    "travel": {
        "func": api.travel,
        "multi": true,
    },
    "bladeburner": {
        "func": api.setToBladeburnerAction,
        "multi": false,
    },
    "recovery": {
        "func": api.setToShockRecovery,
        "multi": true,
    },
    "sync": {
        "func": api.setToSynchronize,
        "multi": true,
    },
}

export async function main(ns) {
    var sleeveCount = ns.sleeve.getNumSleeves()
    if (sleeveCount >= 1) {
        return
    }
    var action = ns.args.length >= 1 ? ns.args[0] : "study"
    var params = ns.args.slice(1)
    if (!Object.keys(work).includes(action)) {
        ns.tprintf("Unknown action '%s', use one of: %s", action, Object.keys(work))
        return
    }
    for (var id = 0; id < sleeveCount; id++) {
        let status = work[action]["func"](...params)
        if (!work[action]["multi"] && status) {
            return
        }
    }
}