import {
    filter_adminRights,
    filter_canNuke,
    filter_minRam,
    filter_hostname,
    filter_playerServer,
    getAllServers,
    applyFilter,
    deployPayload,
    portOpener,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var noAdminFilter = filter_adminRights(false)
    var hasAdminFilter = filter_adminRights(true)
    var canNukeFilter = filter_canNuke(ns)
    var ramFilter = filter_minRam(4)
    var nameFilter = filter_hostname(ns, "darkweb|home")
    var playerServerFilter = filter_playerServer()

    var targets = getAllServers(ns)
    targets = applyFilter(targets, [noAdminFilter, canNukeFilter], false, false)
    targets = applyFilter(targets, [nameFilter, playerServerFilter])
    for (const t in targets) {
        ns.printf("Nuking Target: %s", targets[t].hostname)
        attack(ns, targets[t])
    }

    targets = getAllServers(ns)
    targets = applyFilter(targets, [hasAdminFilter, ramFilter], false, false)
    for (const t in targets) {
        ns.printf("Deploying payload on Target: %s", targets[t].hostname)
        await deployPayload(ns, t)
    }
}

async function attack(ns, target) {
    var po = portOpener(ns)
    if (target.openPortCount < target.numOpenPortsRequired) {
        for (let attack of po) {
            if (attack["check"](target)) {
                attack["func"](target.hostname)
            }
        }
    }
    ns.nuke(target.hostname)

    // if (!target.backdoorInstalled) {
    //     await ns.singularity.installBackdoor(target.hostname)
    // }
}