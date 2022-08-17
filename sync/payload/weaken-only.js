/** @param {import("../..").NS } ns */
export async function main(ns) {
    var name = ns.args[0]
    var threads = ns.args[1]
    await ns.weaken(name, { threads: threads })
}