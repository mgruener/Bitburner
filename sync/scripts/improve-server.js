/** @param {import("../..").NS } ns */
export async function main(ns) {
    var script = ns.getScriptName()
    if (ns.args.length < 1) {
        ns.tprintf("Usage: %s <server>", script)
        return
    }
    var name = ns.args[0]
    var server = ns.getServer(name)

    ns.tail(script)
    ns.disableLog("sleep")

    while (server.minDifficulty > 1) {
        let preSec = server.minDifficulty
        ns.printf("Lowering minimum security for '%s'", name)

        await buyHashUpgrade(ns, "Reduce Minimum Security", name)
        server = ns.getServer(name)

        let postSec = server.minDifficulty
        let diff = preSec - postSec
        if (diff != 0) {
            ns.printf("Lowered server security -> pre: %d; post: %d; diff: %d", preSec, postSec, diff)
        }
        await ns.sleep(1000)
    }
    while (server.moneyMax < 10000000000000) {
        let preMoney = server.moneyMax
        ns.printf("Lowering minimum security for '%s'", name)

        await buyHashUpgrade(ns, "Increase Maximum Money", name)
        server = ns.getServer(name)

        let postMoney = server.moneyMax
        let diff = postMoney - preMoney
        if (diff != 0) {
            ns.printf("Increased server max money -> pre: %s; post: %s; diff: %s", ns.nFormat(preMoney, "($0.00a)"), ns.nFormat(postMoney, "($0.00a)"), ns.nFormat(diff, "($0.00a)"))
        }
        await ns.sleep(1000)
    }
}

/** @param {import("../..").NS } ns */
async function buyHashUpgrade(ns, upgrade, target) {
    var cost = ns.hacknet.hashCost(upgrade, 1)
    var hashes = ns.hacknet.numHashes()
    while (hashes >= cost) {
        ns.printf("Buying hash upgrade '%s' for server '%s' for %s hashes", upgrade, target, ns.nFormat(cost, "(0.00a)"))
        ns.hacknet.spendHashes(upgrade, target, 1)
        hashes = ns.hacknet.numHashes()
        cost = ns.hacknet.hashCost(upgrade, 1)
        await ns.sleep(100)
    }
}