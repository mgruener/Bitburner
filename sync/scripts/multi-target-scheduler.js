import {
    applyFilter,
    filter_adminRights,
    filter_minRamAvailable,
    getAllServers,
    prepareAttack,
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
        for (const targetName of schedulables) {
            let target = getAdditionalServerInfo(ns, ns.getServer(targetName))
            let attackers = getAttackers(ns)

            // no attackers available, skip this scheduling cycle
            if (Object.keys(attackers).length <= 0) {
                continue
            }

            var nextAttack = getHackAttack(ns)
            if (target.hackDifficulty > target.securityThreshold) {
                nextAttack = getWeakenAttack(ns)
            } else if (target.moneyAvailable < target.moneyThreshold) {
                nextAttack = getGrowAttack(ns)
            }
            nextAttack = prepareAttack(ns, nextAttack, target, attackers)
            if (nextAttack["requiredThreads"] <= 0) {
                ns.tprintf("Zero thread count for attack: t: %s; a: %s", nextAttack["target"].hostname, nextAttack["type"])
                continue
            }
            var proc = performAttack(ns, nextAttack)
            procs[targetName] = proc
        }
        printState(ns, procs, targets)
        let waitResult = await wait(ns, procs, startDate)
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

async function wait(ns, procs, startDate = new Date()) {
    var newProcs = {}
    await ns.sleep(200)
    var newStartDate = new Date()
    var endDate = new Date()
    var iterationTime = endDate.getTime() - startDate.getTime()
    ns.printf("Schedule iteration took %s ms", iterationTime)
    for (const proc in procs) {
        let newWaitTime = procs[proc]["waitTime"] - iterationTime
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
                proc["target"].hostname,
                proc["type"],
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

// hack 0.002 -> 25 hack threads / 1 weaken thread
// grow 0.004 -> 25 grow threads / 2 weaken threads
// weaken 0.05
/** @param {import("../..").NS } ns */
function prepareBatch(ns, target) {
    // weaken() can easily be parallelized because its only effect
    // is the security level reduction so we just need to
    // somehow creates a  batch that defines the required number
    // of weaken() calls to get to the desired difficulty
    if (target.hackDifficulty != minDifficulty) {
        // lower to minDifficulty -> weaken()
        return
    }
    // because results for grow() and hack() are calculated
    // at the end of their execution time, each batch must be
    // calculated by attacking server and it must be ensured
    // that all batches finish in a deterministic order so that
    // each batch has "cleaned up" after itself before the next
    // batch finishes
    if (target.moneyAvailable != target.moneyMax) {
        // grow to max money -> grow() + weaken()
        return
    }
    // server is at minDifficulty and maxMoney
    // start hacking it -> hack() + weaken() + grow() + weaken()
    return
}