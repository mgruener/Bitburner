import {
    filter_adminRights,
    filter_minRamAvailable,
    getAllServers,
    applyFilter,
    ramAvail,
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
        // we don't ever want to use home to boost faction gain as the compute
        // power there is way to valuable for that. Given a large enough size
        // later in the game, most attacks are executed from home, so we can use
        // all other compute power for sharing.
        if (targets[t].hostname == "home") {
            continue
        }
        let serverThreads = Math.floor(ramAvail(targets[t]) / scriptRam)
        if (ns.exec(script, t, serverThreads) == 0) {
            ns.tprintf("Failed to share() on '%s' with %d threads", t, serverThreads)
        }
    }
    await ns.sleep(2000)
    ns.tprintf("Share power: %f", ns.getSharePower())
}