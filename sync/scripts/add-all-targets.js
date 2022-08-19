import {
    getAllServers,
    applyFilter,
    filter_hackingSkill,
    filter_minMaxMoney,
    filter_adminRights,
    getTargetAddPort,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var skillFilter = filter_hackingSkill(ns.getHackingLevel())
    var maxMoneyFilter = filter_minMaxMoney(1)
    var hasAdminFilter = filter_adminRights(false)
    var servers = applyFilter(getAllServers(ns), [skillFilter, hasAdminFilter])
    servers = applyFilter(servers, [maxMoneyFilter], false)

    var addPort = getTargetAddPort(ns)
    for (const t of Object.keys(servers)) {
        ns.tprintf("Adding %s as target", t)
        while (!addPort.tryWrite(t)) {
            await ns.sleep(1000)
        }
    }
}