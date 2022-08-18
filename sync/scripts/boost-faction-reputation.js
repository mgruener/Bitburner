import {
    filter_adminRights,
    filter_minRamAvailable,
    getAllServers,
    applyFilter,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var script = "/payload/share.js"
    var scriptRam = ns.getScriptRam(script)
    var hasAdminFilter = filter_adminRights(true)
    var ramFilter = filter_minRamAvailable(scriptRam)
    var targets = getAllServers(ns)
    targets = applyFilter(targets, [hasAdminFilter, ramFilter], false, false)
    for (const t in targets) {
        let serverThreads = Math.floor((targets[t].maxRam - targets[t].ramUsed) / scriptRam)
        if (ns.exec(script, t, serverThreads) == 0) {
            ns.tprintf("Failed to share() on '%s' with %d threads", t, serverThreads)
        }
    }
    await ns.sleep(2000)
    ns.tprintf("Share power: %f", ns.getSharePower())
}