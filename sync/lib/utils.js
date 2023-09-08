/** @param {import("../..").NS } ns */
export function _getAllServers(ns) {
	// result is a dict of str => Server
	var knownHosts = {}

	// always start scanning at our "home" server
	var entryPoint = "home"
	var hostsToScan = [entryPoint]

	// While we still have hosts eligible to be scanned
	// iterate over all of them, scan them to get the list
	// of other hosts they "see", then remove already known
	// and duplicate hosts. Make the resulting list the new list
	// of hosts eligible to scan
	ns.disableLog("scan")
	while (hostsToScan.length > 0) {
		var scanCandidates = []
		for (const host of hostsToScan) {
			let server = ns.getServer(host)
			let scanResult = ns.scan(host).filter((h) => h != host)
			knownHosts[host] = { ...server, "children": scanResult }
			scanCandidates = scanCandidates.concat(scanResult)
		}

		// create a new list of scan eligible hosts
		// by filtering out all already known and duplicate
		// hosts from the scan candidates
		hostsToScan = []
		for (const candidate of scanCandidates) {
			if (hostsToScan.includes(candidate) || (candidate in knownHosts)) {
				continue
			}
			hostsToScan.push(candidate)
		}
	}
	return knownHosts
}

/** @param {import("../..").NS } ns */
export function getAllServers(ns) {
	var servers = _getAllServers(ns)
	var result = {}
	for (const server in servers) {
		result[server] = getAdditionalServerInfo(ns, servers[server])
	}
	return result
}


export function applyFilter(hosts, filter = [], exclude = true, matchAny = true) {
	var results = []
	var hostnames = Object.keys(hosts)
	for (const f of filter) {
		let filterResults = hostnames.filter(name => f(hosts[name]))
		results.push(filterResults)
	}
	var matcher = intersection
	if (matchAny) {
		matcher = union
	}
	var result = {}
	var filtered = matcher(...results)
	if (exclude) {
		filtered = difference(hostnames, filtered)
	}

	for (const name of filtered) {
		result[name] = hosts[name]
	}
	return result
}

export function filter_hostname(regex) {
	var re = new RegExp(sprintf("^%s$", regex))
	return (function (host) {
		return re.test(host.hostname)
	})
}

export function filter_hackingSkill(level) {
	return (function (host) {
		return (level < host.requiredHackingSkill)
	})
}

export function filter_adminRights(adminRightsPresent = true) {
	return (function (host) {
		return (host.hasAdminRights == adminRightsPresent)
	})
}

export function filter_minRam(size) {
	return (function (host) {
		return (host.maxRam >= size)
	})
}

export function ramAvail(host) {
	let reserved = 0
	if (host.hostname == "home") {
		reserved = 32
	}
	return Math.max(host.maxRam - (host.ramUsed + reserved), 0)
}

export function filter_minRamAvailable(size) {
	return (function (host) {
		return (ramAvail(host) >= size)
	})
}

export function filter_canNuke(ns = true) {
	var po = portOpener(ns)
	var maxOpenPortsRequired = po.length
	return (function (host) {
		return (host.numOpenPortsRequired <= maxOpenPortsRequired)
	})
}

export function filter_playerServer(state = true) {
	return (function (host) {
		return (host.purchasedByPlayer == state)
	})
}

export function filter_minMaxMoney(amount = 1) {
	return (function (host) {
		return (host.moneyMax >= amount)
	})
}

export function filter_hasBackdoor(state = true) {
	return (function (host) {
		return (host.backdoorInstalled == state)
	})
}

export function filter_and(filters) {
	return (function (host) {
		filters.forEach(function (f) {
			if (!f(host)) {
				return false
			}
		})
	})
}

export function filter_or(filters) {
	return (function (host) {
		filters.forEach(function (f) {
			if (f(host)) {
				return true
			}
		})
	})
}

export function filter_not(filter) {
	return (function (host) {
		return !filter(host)
	})
}

export function portOpener(ns) {
	var portOpener = []
	if (ns.fileExists("BruteSSH.exe", "home")) {
		portOpener.push({ "func": ns.brutessh, "check": (s) => !s.sshPortOpen })
	}

	if (ns.fileExists("FTPCrack.exe", "home")) {
		portOpener.push({ "func": ns.ftpcrack, "check": (s) => !s.ftpPortOpen })
	}

	if (ns.fileExists("relaySMTP.exe", "home")) {
		portOpener.push({ "func": ns.relaysmtp, "check": (s) => !s.smtpPortOpen })
	}

	if (ns.fileExists("HTTPWorm.exe", "home")) {
		portOpener.push({ "func": ns.httpworm, "check": (s) => !s.httpPortOpen })
	}

	if (ns.fileExists("SQLInject.exe", "home")) {
		portOpener.push({ "func": ns.sqlinject, "check": (s) => !s.sqlPortOpen })
	}
	return portOpener
}

export function union(...lists) {
	return [...(new Set(lists.flat()))]
}

export function unique(...lists) {
	return lists.flat().filter((v, i, a) => a.indexOf(v) === a.lastIndexOf(v))
}

export function intersection(...lists) {
	var input = [...lists]
	var result = input.shift()
	for (const l of input) {
		result = result.filter(x => l.includes(x))

	}
	return [...(new Set(result))]
}

export function difference(...lists) {
	var input = [...lists]
	var result = input.shift()
	for (const l of input) {
		result = result.filter(x => !l.includes(x))
	}
	return [...(new Set(result))]
}

export function threadsAvailable(ns, threadSize, onlyFree = true) {
	var adminFilter = filter_adminRights(true)
	var targets = _getAllServers(ns)
	var ramFilter = filter_minRamAvailable(threadSize)
	if (!onlyFree) {
		ramFilter = filter_minRam(threadSize)
	}
	targets = applyFilter(targets, [adminFilter, ramFilter], false, false)

	var threads = 0
	for (const name in targets) {
		let target = targets[name]
		let ram = ramAvail(target)
		if (!onlyFree) {
			ram = target.maxRam
		}
		let serverThreads = Math.floor(ram / threadSize)
		threads = threads + serverThreads
	}
	return threads
}

export function getWeakenThreads(ns, server, attacker = server) {
	var threadsAvail = ramAvail(attacker) / 1.75
	var targetAmount = Math.max(server.hackDifficulty - server.minDifficulty, 0)
	var threadsRequired = Math.ceil(targetAmount / ns.weakenAnalyze(1))
	// if the provided attacker has enough compute power to perform the full weaken
	// with one core in one go although it has more than one core, re-calculate the
	// required amount of threads with the proper amount of cpu cores to optimize
	// the resource usage
	if ((threadsAvail >= threadsRequired) && (attacker.cpuCores > 1)) {
		return Math.ceil(targetAmount / ns.weakenAnalyze(1, attacker.cpuCores))
	}
	return threadsRequired
}

export function getGrowThreads(ns, server, attacker = server) {
	// 1.75GB is the size of the simplest grow script
	var threadsAvail = ramAvail(attacker) / 1.75
	var money = server.moneyAvailable
	// If we made a mistake and fully drained a server, we assume the
	// we need 1000 threads, which is the same as assuming the server has $1000.
	// Normally, with a non-drained server the whole setup looks like this:
	//   threads = growthAnalyze(moneyMax / moneyAvail)
	//   maxMoney = moneyAvail + (moneyAvail * growPercent(threads))
	// With a drained server this becomes
	//   threads = growthAnalyze(moneyMax / threads)
	//   maxMoney = threads + (threads * formulas.growPercent(threads))
	// Because for a drained server, grow() assumes $1 for each thread.
	// As in this case the input of growthAnalyze depends on its output, we cannot use it.
	// And without "cheating" (i.e. extracting the actual growPercent calculation from the source),
	// we have no way of reliably calculating the amount of threads needed for 
	// a drained server, so we assume a more or less arbitrary amount.
	if (money <= 0) {
		return 1000
	}
	var growFactor = server.moneyMax / money
	var threadsRequired = Math.ceil(ns.growthAnalyze(server.hostname, growFactor))
	// if the provided attacker has enough compute power to perform the full grow
	// with one core in one go although it has more than one core, re-calculate the
	// required amount of threads with the proper amount of cpu cores to optimize
	// the resource usage
	if ((threadsAvail >= threadsRequired) && (attacker.cpuCores > 1)) {
		return Math.ceil(ns.growthAnalyze(server.hostname, growFactor, attacker.cpuCores))
	}
	return threadsRequired
}

// returns the amount of threads required to hack 99% of the servers
// available money, up to the given max amount.
// This can return 0 if even a single thread would hack more than
// 99% of the money available on the server (e.g. on a server with max 
// $100, $2 available and a single hack thread would hack >$1.1 this will
// return 0)
export function getHackThreads(ns, server, maxAmount = Infinity) {
	// Don't ever fully drain a server.
	// The amount of money created by grow() is based on the
	// moneyAvailable on the server. If moneyAvailable == 0,
	// grow() assumes the server has $1 for each thread it is called
	// with, making it impossible (for my; mayby just complicated for someone else)
	// to determine the amount of threads required to grow a server to a given amount.
	// Always reserve 1% of money on the server.
	var money = Math.min(maxAmount, server.moneyAvailable - (server.moneyAvailable * 0.01))
	var hackThreads = Math.floor(ns.hackAnalyzeThreads(server.hostname, money))
	if (isFinite(hackThreads)) {
		return hackThreads
	}
	return 1
}

export async function deployPayload(ns, name) {
	if (name == "home") {
		return
	}
	const files = [
		"/lib/utils.js",
		"/payload/hack-only.js",
		"/payload/grow-only.js",
		"/payload/weaken-only.js",
		"/payload/share.js",
		"/payload/backdoor.js",
	]
	await ns.scp(files, name, "home")
}

export function hasFormulas(ns) {
	return ns.fileExists("Formulas.exe", "home")
}

export function maxRegrowAmount(ns, server, secThreshold, cores = 1) {
	if (server.purchasedByPlayer) {
		return 0
	}
	var threadsAvail = threadsAvailable(ns, 1.7, false)
	var maxAmount = server.moneyMax - server.moneyAvailable
	if (maxAmount <= 0) {
		maxAmount = server.moneyMax
	}
	if (!hasFormulas(ns)) {
		return maxAmount
	}
	var srv = { ...server }
	srv.hackDifficulty = secThreshold
	var growPercent = ns.formulas.hacking.growPercent(srv, threadsAvail, ns.getPlayer(), cores)
	if (growPercent == Infinity) {
		return server.moneyMax
	}
	return Math.min(server.moneyMax, (server.moneyAvailable * growPercent) - server.moneyAvailable)
}

export function getAdditionalServerInfo(ns, server, attacker = server) {
	var result = {
		...server,
		"moneyThreshold": 0,
		"securityThreshold": 0,
		"weakenThreads": 0,
		"growThreads": 0,
		"hackThreads": 0,
		"maxRegrowAmount": 0,
		"weakenTime": 0,
		"hackTime": 0,
		"growTime": 0,
		"score": 0,
		"timeScore": 0,
	}
	if (server.purchasedByPlayer) {
		return result
	}
	var name = server.hostname
	var moneyThreshold = server.moneyMax * 0.75
	var securityThreshold = server.minDifficulty + 5
	var maxRegrow = maxRegrowAmount(ns, server, securityThreshold, attacker.cpuCores)
	var weakenTime = ns.getWeakenTime(name)
	var hackTime = ns.getHackTime(name)
	var growTime = ns.getGrowTime(name)
	var fakeServer = { ...server }
	fakeServer.hackDifficulty = securityThreshold
	if (hasFormulas(ns)) {
		var player = ns.getPlayer()
		weakenTime = ns.formulas.hacking.weakenTime(fakeServer, player)
		hackTime = ns.formulas.hacking.hackTime(fakeServer, player)
		growTime = ns.formulas.hacking.growTime(fakeServer, player)
	}
	var score = server.moneyMax / (server.minDifficulty / server.serverGrowth)
	var timeScore = server.moneyMax / ((2 * weakenTime + growTime + hackTime) / 1000)
	result = {
		...server,
		"moneyThreshold": moneyThreshold,
		"securityThreshold": securityThreshold,
		"weakenThreads": getWeakenThreads(ns, server, attacker),
		"growThreads": getGrowThreads(ns, server, attacker),
		"hackThreads": getHackThreads(ns, server, maxRegrow),
		"maxRegrowAmount": maxRegrow,
		"weakenTime": weakenTime,
		"hackTime": hackTime,
		"growTime": growTime,
		"score": score,
		"timeScore": timeScore,
	}
	return result
}

export async function buyServers(ns) {
	const minRam = 64
	let prefix = ns.sprintf("pserv-%d", minRam)
	if (ns.getPurchasedServers().length >= ns.getPurchasedServerLimit()) {
		return true
	}
	let serverCost = ns.getPurchasedServerCost(minRam)
	while (canAfford(ns, serverCost)) {
		let name = ns.purchaseServer(prefix, minRam);
		await deployPayload(ns, name)
		if (ns.getPurchasedServers().length >= ns.getPurchasedServerLimit()) {
			return true
		}
	}
	return false
}

export function getServersByRam(ns) {
	var servers = {}
	for (const name of ns.getPurchasedServers()) {
		let ram = ns.getServerMaxRam(name)
		if (ram in servers) {
			servers[ram].push(name)
			continue
		}
		servers[ram] = [name]
	}
	return servers
}

export function maxServerUpgrade(ns) {
	var maxUpgrade = ns.getPurchasedServerMaxRam()
	var maxUpgradeCost = ns.getPurchasedServerLimit() * ns.getPurchasedServerCost(maxUpgrade)
	while (!canAfford(ns, maxUpgradeCost) && (maxUpgrade > 4)) {
		maxUpgrade = maxUpgrade / 2
		maxUpgradeCost = ns.getPurchasedServerLimit() * ns.getPurchasedServerCost(maxUpgrade)
	}
	return maxUpgrade
}

export async function bulkServerUpgrade(ns, ramLimit = ns.getPurchasedServerMaxRam()) {
	let prefix = ns.sprintf("pserv-%d", ramLimit)
	if (canAfford(ns, ns.getPurchasedServerLimit() * ns.getPurchasedServerCost(ramLimit))) {
		// clean up the old stuff
		for (const name of ns.getPurchasedServers()) {
			if (ns.getServer(name).maxRam < ramLimit) {
				ns.killall(name, false)
				ns.deleteServer(name)
			}
		}
		while (ns.getPurchasedServers().length < ns.getPurchasedServerLimit()) {
			let newName = ns.purchaseServer(prefix, ramLimit);
			if (newName == "") {
				return false
			}
			await deployPayload(ns, newName)
		}
		return true
	}
	return false
}

export async function upgradeServers(ns, ramLimit = 256) {
	var maxServers = ns.getPurchasedServerLimit()
	// someday
	// var ramLimit = ns.getPurchasedServerMaxRam()
	// only start upgrading if we are already at our maximum server count
	if (ns.getPurchasedServers().length < maxServers) {
		return false
	}
	ns.disableLog("getServerMaxRam")

	var servers = {}
	while (!(ramLimit in servers) || (servers[ramLimit].length < maxServers)) {
		servers = getServersByRam(ns)
		let ramSizes = [...Object.keys(servers)].sort((a, b) => a - b)
		let maxRamSize = ramSizes[ramSizes.length - 1]
		let targetRamSize = Math.min(maxRamSize * 2, ramLimit)
		if (servers[maxRamSize].length < maxServers) {
			targetRamSize = maxRamSize
			ramSizes.pop()
		} else if (maxRamSize == ramLimit) {
			return true
		}
		let prefix = ns.sprintf("pserv-%d", targetRamSize)
		for (const size of ramSizes) {
			for (const name of servers[size]) {
				let upgradeCost = ns.getPurchasedServerCost(targetRamSize)
				if (!canAfford(ns, upgradeCost)) {
					// not enough money to further upgrade, stop here
					return false
				}
				ns.killall(name, false)
				ns.deleteServer(name)
				let newName = ns.purchaseServer(prefix, targetRamSize);
				await deployPayload(ns, newName)
				await ns.sleep(100)
			}
		}
	}
	return true
}

export function isRunning(ns, script, args) {
	var procs = ns.ps("home")
	for (const proc of procs) {
		let scriptMatch = false
		let argsMatch = false
		if (proc.filename == script) {
			scriptMatch = true
		}
		argsMatch = arrayEqual(args, proc.args)
	}
}

export function arrayEqual(a, b) {
	if (a.length != b.length) {
		return false
	}
	var _a = [...a].sort()
	var _b = [...b].sort()
	for (var index = 0; index < _a.length; index++) {
		if (_a[index] != _b[index]) {
			return false
		}
	}
	return true
}

export function setMoneyLimit(ns, val) {
	var port = getMoneyLimitPort(ns)
	if (port.empty()) {
		port.write(val)
		return
	}
	port.write(val)
	port.read()
	return
}

export function getMoneyLimit(ns) {
	var port = getMoneyLimitPort(ns)
	if (port.empty()) {
		return 0
	}
	return port.peek()
}

export function myMoney(ns) {
	ns.disableLog("getServerMoneyAvailable")
	return ns.getServerMoneyAvailable("home")
}

export function canAfford(ns, cost) {
	return ((myMoney(ns) - cost) >= getMoneyLimit(ns))
}


// set shouldThreads to -1 to automatically determine the number of threads
export async function schedule(ns, script, shouldThreads = 1, args = []) {
	var threads = parseInt(shouldThreads)
	if (threads == 0) {
		ns.tprintf("Failed to schedule '%s': threads must be > 0 or -1, is %d", script, threads)
		return false
	}
	var threadFactor = threads < 0 ? 1 : threads
	var size = ns.getScriptRam(script, "home") * threadFactor
	var hasAdminFilter = filter_adminRights(true)
	var ramFilter = filter_minRamAvailable(size)
	var candidates = applyFilter(getAllServers(ns), [hasAdminFilter, ramFilter], false, false)
	var target = ""
	var targetRamAvail = -1
	for (const name in candidates) {
		let candidateRamAvail = ramAvail(candidates[name])
		if (candidateRamAvail > targetRamAvail) {
			target = name
			targetRamAvail = candidateRamAvail
		}
	}
	if (target == "") {
		return false
	}
	if (target != "home") {
		await ns.scp("/lib/utils.js", target, "home")
		await ns.scp(script, target, "home")
	}
	var maxThreads = Math.floor(targetRamAvail / size)
	var execThreads = threads < 0 ? maxThreads : threads
	return ns.exec(script, target, execThreads, ...args) != 0
}

export function performAttack(ns, attack, target, attackers) {
	var requiredThreads = target[attack["threads"]]
	var waitTime = attack["wait"](target.hostname) + 25
	var attackThreads = 0
	var serverCount = 0
	var scriptRam = ns.getScriptRam(attack["script"])

	ns.disableLog("exec")
	var pids = []
	// this sorts the servers according to the amount of threads required by
	// a single core system (assuming that all attackable systems are single core)...
	var servers = sortObjectBy(attackers, sortByComputePower(requiredThreads))
	// ...lets see if we can reduce the amount of threads required by re-calculating
	// this with the most suitable attacker
	requiredThreads = getAdditionalServerInfo(ns, target, servers[0])[attack["threads"]]
	var threadCount = requiredThreads
	if (threadCount <= 0) {
		ns.tprintf("Zero thread count for attack: t: %s; a: %s", target.hostname, attack["type"])
		return {
			"waitTime": 0,
			"requiredThreads": requiredThreads,
			"attackThreads": 0,
			"operation": attack["type"],
			"serverCount": 0,
			"pids": [],
			"target": target.hostname,
		}
	}
	for (const server of servers) {
		let serverThreads = Math.floor((ramAvail(server) / scriptRam))
		if (serverThreads > threadCount) {
			serverThreads = threadCount
		}
		let pid = ns.exec(attack["script"], server.hostname, serverThreads, target.hostname, serverThreads)
		if (pid == 0) {
			ns.tprintf("Error while performing '%s' on %s from %s", attack["type"], target.hostname, server.hostname)
			continue
		}
		pids.push(pid)
		threadCount = threadCount - serverThreads
		attackThreads = attackThreads + serverThreads
		serverCount++
		if (threadCount <= 0) {
			break
		}
	}
	return {
		"waitTime": waitTime,
		"requiredThreads": requiredThreads,
		"attackThreads": attackThreads,
		"operation": attack["type"],
		"serverCount": serverCount,
		"pids": pids,
		"target": target.hostname,
	}
}

export function getGrowAttack(ns) {
	return {
		"type": "grow",
		"wait": ns.getGrowTime,
		"threads": "growThreads",
		"script": "/payload/grow-only.js",
	}
}

export function getWeakenAttack(ns) {
	return {
		"type": "weaken",
		"wait": ns.getWeakenTime,
		"threads": "weakenThreads",
		"script": "/payload/weaken-only.js",
	}
}

export function getHackAttack(ns) {
	return {
		"type": "hack",
		"wait": ns.getHackTime,
		"threads": "hackThreads",
		"script": "/payload/hack-only.js",
	}
}

export function getTargetAddPort(ns) {
	return ns.getPortHandle(1)
}

export function getTargetRemovePort(ns) {
	return ns.getPortHandle(2)
}

export function getMoneyLimitPort(ns) {
	return ns.getPortHandle(3)
}

export function sortArrayBy(list, sortFunc) {
	return [...list].sort(sortFunc)
}

export function sortObjectBy(object, sortFunc) {
	return [...Object.values(object)].sort(sortFunc)
}


// the function is called with func(elem[key])
export function sortByFunctionValue(func, key) {
	return (function (x, y) {
		if (func(x[key]) < func(y[key])) {
			return -1
		}
		if (func(x[key]) > func(y[key])) {
			return 1
		}
		return 0
	})
}

export function sortByKey(key) {
	return (function (x, y) {
		if (x[key] < y[key]) {
			return -1
		}
		if (x[key] > y[key]) {
			return 1
		}
		return 0
	})
}

export function sortByComputePower(fullSize) {
	return (function (x, y) {
		let xAvail = ramAvail(x)
		let yAvail = ramAvail(y)
		let xDiff = Math.max(fullSize - xAvail, 0)
		let yDiff = Math.max(fullSize - yAvail, 0)
		if ((xDiff <= 0) && !(yDiff <= 0)) {
			return -1
		}
		if (!(xDiff <= 0) && (yDiff <= 0)) {
			return 1
		}
		if ((xDiff == 0) && (yDiff == 0)) {
			if (x.cpuCores > y.cpuCores) {
				return -1
			}
			if (x.cpuCores < y.cpuCores) {
				return 1
			}
			if (xAvail < yAvail) {
				return -1
			}
			if (xAvail > yAvail) {
				return 1
			}
		}
		if (xAvail > yAvail) {
			return -1
		}
		if (xAvail < yAvail) {
			return 1
		}
		return 0
	})
}