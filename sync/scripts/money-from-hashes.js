/** @param {import("../..").NS } ns */
export async function main(ns) {
    ns.tail(ns.getScriptName())
    ns.disableLog("sleep")

    var moneyHashCost = ns.hacknet.hashCost("Sell for Money", 1)
    var count = Math.floor(ns.hacknet.numHashes() / moneyHashCost)

    while (true) {
        if (count > 0) {
            ns.printf("Selling %s hashes for %s", (count * moneyHashCost), ns.nFormat(1000000 * count, "($0.00a)"))
            ns.hacknet.spendHashes("Sell for Money", "", count)
        }
        count = Math.floor(ns.hacknet.numHashes() / moneyHashCost)
        await ns.sleep(1000)
    }
}