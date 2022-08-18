/** @param {import("../..").NS } ns */
export async function main(ns) {
    var base = 8
    var ram = base
    while (ram <= ns.getPurchasedServerMaxRam()) {
        ns.tprintf(
            "%9s: %8s (%8s)",
            ns.nFormat(ram * 1024 * 1024 * 1024, "0.00ib"),
            ns.nFormat(ns.getPurchasedServerCost(ram), "($0.00a)"),
            ns.nFormat(ns.getPurchasedServerCost(ram) * ns.getPurchasedServerLimit(), "($0.00a)")
        )
        ram = ram * 2
    }
}