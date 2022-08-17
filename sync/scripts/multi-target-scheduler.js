import {
    applyFilter,
    filter_adminRights,
    filter_minRamAvailable,
    getAdditionalServerInfo,
    getAllServers,
    performAttack,
    getGrowAttack,
    getWeakenAttack,
    getHackAttack,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    const targets = ns.args
    const growAttack = getGrowAttack(ns)
    const weakenAttack = getWeakenAttack(ns)
    const hackAttack = getHackAttack(ns)

    let procs = {}
    while (true) {
        let schedulables = getSchedulables(targets, procs)
        for (const targetName of schedulables) {
            let target = ns.getServer(targetName)
            let addonInfo = getAdditionalServerInfo(ns, target)
            let attackers = getAttackers(ns)

            // no attackers available, skip this scheduling cycle
            if (Object.keys(attackers).length <= 0) {
                continue
            }

            let waitTime = 0
            if (target.hackDifficulty > addonInfo.securityThreshold) {
                waitTime = performAttack(ns, weakenAttack, target, attackers)
            } else if (target.moneyAvailable < addonInfo.moneyThreshold) {
                waitTime = performAttack(ns, growAttack, target, attackers)
            } else {
                waitTime = performAttack(ns, hackAttack, target, attackers)
            }
            procs[targetName] = waitTime
        }
        procs = await wait(ns, procs)
    }
}

function getAttackers(ns) {
    var hasAdminFilter = filter_adminRights(true)
    // 1.6G base script size + 0.15G (weaken/grow)
    // hack() requires 0.1G so it works everywhere where weaken/grow works
    var ramFilter = filter_minRamAvailable(ns.getScriptRam("/payload/weaken-only.js"))
    return applyFilter(getAllServers(ns), [hasAdminFilter, ramFilter], false, false)
}

function getSchedulables(targets, procs) {
    var schedulables = []
    var running = Object.keys(procs)
    for (const t of targets) {
        if (!running.includes(t)) {
            schedulables.push(t)
        }
    }
    return schedulables
}

async function wait(ns, procs) {
    var newProcs = {}
    var waitOn = ""
    var waitTime = Infinity
    for (const proc in procs) {
        let procWait = procs[proc]
        if (procWait < waitTime) {
            waitOn = proc
            waitTime = procWait
        }
    }
    if (waitOn == "") {
        return newProcs
    }
    await ns.sleep(waitTime)
    for (const proc in procs) {
        if (proc == waitOn) {
            continue
        }
        newProcs[proc] = procs[proc] - waitTime
    }
    return newProcs
}