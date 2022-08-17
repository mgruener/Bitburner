import { threadsAvailable } from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var threadSize = 0.15 + 1.6
    var threads = threadsAvailable(ns, threadSize, true)
    ns.tprintf("==> Threads available: %d", threads)
}