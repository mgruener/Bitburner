/** @param {import("../..").NS } ns */
export async function main(ns) {
	ns.tprintf("1: %d", parseInt(1))
	ns.tprintf("-1: %d", parseInt(-1))
	ns.tprintf("'1': %d", parseInt('1'))
	ns.tprintf("'-1': %d", parseInt('-1'))
	ns.tprintf("+'-1': %d", +'-1')
}
