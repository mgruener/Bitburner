import {
    filter_hostname,
    filter_playerServer,
    getAllServers,
    applyFilter,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var known = []
    var nameFilter = filter_hostname(ns, "darkweb|home")
    var playerServerFilter = filter_playerServer(true)
    var targets = getAllServers(ns)
    targets = applyFilter(targets, [nameFilter, playerServerFilter])


    for (const t in targets) {
        let result = []
        for (const f of ns.ls(t)) {
            if (f.startsWith("/payload/") || f.startsWith("/lib/") || f.startsWith("/scripts/") || f.startsWith("/scratch/")) {
                continue
            }
            if (!known.includes(f)) {
                result.push(f)
                known.push(f)
            }
        }
        if (result.length > 0) {
            ns.tprintf("%s:", t)
            for (const f of result) {
                ns.tprintf("  %s", f)
                if (f.endsWith(".lit")) {
                    await ns.scp(f, "home", t)
                }
            }
        }
    }
}