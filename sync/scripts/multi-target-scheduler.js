import {
    applyFilter,
    filter_adminRights,
    filter_minRamAvailable,
    getAllServers,
    performAttack,
    getGrowAttack,
    getWeakenAttack,
    getHackAttack,
    getTargetAddPort,
    getTargetRemovePort,
    threadsAvailable,
    sortObjectBy,
    sortByKey,
    getAdditionalServerInfo,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var targets = [...ns.args]
    const growAttack = getGrowAttack(ns)
    const weakenAttack = getWeakenAttack(ns)
    const hackAttack = getHackAttack(ns)
    ns.disableLog("disableLog")
    ns.disableLog("sleep")

    // If there is an already running instance of the scheduler
    // just add the parameters as targets and exit. Bitburner
    // itself prevents multiple instances of the same script running
    // with the same parameters
    if (isRunning(ns)) {
        let addPort = getTargetAddPort(ns)
        for (const t of targets) {
            while (!addPort.tryWrite(t)) {
                await ns.sleep(1000)
            }
        }
        return
    }

    var procs = {}
    var startDate = new Date()
    while (true) {
        let schedulables = getSchedulables(targets, procs)
        // check if there is anything to schedule and if not,
        // wait a fixed amount before checking again
        if (schedulables.length <= 0) {
            await ns.sleep(5000)
        }
        for (const targetName of schedulables) {
            let target = getAdditionalServerInfo(ns, ns.getServer(targetName))
            let attackers = getAttackers(ns)

            // no attackers available, skip this scheduling cycle
            if (Object.keys(attackers).length <= 0) {
                continue
            }

            var nextAttack = hackAttack
            if (target.hackDifficulty > target.securityThreshold) {
                nextAttack = weakenAttack
            } else if (target.moneyAvailable < target.moneyThreshold) {
                nextAttack = growAttack
            }
            var state = performAttack(ns, nextAttack, target, attackers)
            procs[targetName] = state
        }
        printState(ns, procs, targets)
        let waitResult = await wait(ns, procs, startDate, 1000)
        procs = waitResult["procs"]
        startDate = waitResult["startDate"]
        targets = updateTargets(ns, targets)
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

async function wait(ns, procs, startDate = new Date(), waitTime = 1000) {
    var newProcs = {}
    ns.printf("Sleeping for %s", ns.tFormat(waitTime))
    var endDate = new Date()
    var timeDiff = endDate.getTime() - startDate.getTime()
    await ns.sleep(Math.max(waitTime - timeDiff, 100))
    var newStartDate = new Date()
    for (const proc in procs) {
        let newWaitTime = procs[proc]["waitTime"] - waitTime
        let pids = procs[proc]["pids"]
        let newPids = [...pids].filter((p) => ns.isRunning(p))
        if (newPids.length < 1) {
            continue
        }
        newProcs[proc] = procs[proc]
        newProcs[proc]["pids"] = newPids
        newProcs[proc]["waitTime"] = newWaitTime
    }
    return {
        "procs": newProcs,
        "startDate": newStartDate,
    }
}

function updateTargets(ns, current) {
    var newTargets = [...current]
    var addPort = getTargetAddPort(ns)
    var removePort = getTargetRemovePort(ns)

    while (!addPort.empty()) {
        let data = addPort.read()
        // Just a safety precaution as I have no idea
        // how race-condition safe the port interface is.
        // As in "if empty() returns false, is it guaranteed to
        // stay non empty in the current function?"
        // Also do not add targets that are already present
        if ((data != "NULL PORT DATA") && (!newTargets.includes(data))) {
            if (!ns.serverExists(data)) {
                ns.printf("Failed to add new target, server does not exist: %s", data)
            }
            newTargets.push(data)
        }
    }
    while (!removePort.empty()) {
        let data = removePort.read()
        // See comment above
        if (data != "NULL PORT DATA") {
            newTargets = newTargets.filter((v) => v != data)
        }
    }

    return newTargets
}

function printState(ns, procs, targets) {
    var procNames = [...Object.keys(procs)].sort()
    var sortedProcs = sortObjectBy(procs, sortByKey("waitTime"))
    if (sortedProcs.length > 0) {
        ns.print("Running attacks:")
        for (const proc of sortedProcs) {
            ns.printf("  %20s: %6s (s: %3d / %3d; t: %6d; rt: %6d; wt: %8s)",
                proc["target"],
                proc["operation"],
                proc["pids"].length,
                proc["serverCount"],
                proc["attackThreads"],
                proc["requiredThreads"],
                ns.nFormat(proc["waitTime"] / 1000, "00:00:00"),
            )
        }
    }
    var idleTargets = []
    for (const t of targets) {
        if (!procNames.includes(t)) {
            idleTargets.push(t)
        }
    }
    if (idleTargets.length > 0) {
        ns.print("Idle targets:")
        for (const t of idleTargets) {
            ns.printf("  %s", t)
        }
    }

    let maxAttackScriptSize = ns.getScriptRam("/payload/weaken-only.js")
    let systemThreads = threadsAvailable(ns, maxAttackScriptSize, false)
    let idleThreads = threadsAvailable(ns, maxAttackScriptSize, true)
    ns.printf("System threads: %d (idle); %d (available)", idleThreads, systemThreads)
}

function isRunning(ns) {
    var myself = ns.getScriptName()
    var count = 0
    for (const proc of ns.ps()) {
        if (proc.filename == myself) {
            count++
        }
        if (count > 1) {
            return true
        }
    }
    return false
}