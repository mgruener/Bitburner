import {
	getMoneyLimit,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
	while (true) {
		ns.tprintf("Money limit: %d", getMoneyLimit())
		await ns.sleep(5000)
	}
}
