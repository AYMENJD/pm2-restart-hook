const pm2 = require("pm2");
const util = require("util");

const PARENT_ENV_KEY = process.env.PARENT_ENV_KEY || "PM2_PARENT_APP";
const IGNORE_MANUAL = process.env.IGNORE_MANUAL_RESTARTS === "true";
const RESTART_DELAY_MS =
    parseInt(process.env.CHILD_RESTART_DELAY_MS, 10) || 200;

const listAsync = util.promisify(pm2.list).bind(pm2);
const restartAsync = util.promisify(pm2.restart).bind(pm2);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log(
    `Listening for parent app restarts using ENV key: "${PARENT_ENV_KEY}"`
);

async function handleProcessEvent(packet) {
    const event = packet.event;
    const processFromEvent = packet.process;
    const status = processFromEvent.status;
    const parentAppName = processFromEvent.name;
    const isManually = packet.manually;

    if (processFromEvent[PARENT_ENV_KEY]) return; // This is a child process, ignore its events

    if (event !== "online" || status !== "launching") return;

    if (isManually && IGNORE_MANUAL) {
        console.log(`Ignoring manual restart of '${parentAppName}'`);
        return;
    }

    console.log(`Detected PM2 restart event for app '${parentAppName}'`);

    try {
        const childApps = (await listAsync()).filter(
            (app) =>
                app.pm2_env &&
                app.pm2_env[PARENT_ENV_KEY] === parentAppName &&
                app.name !== parentAppName
        );

        if (childApps.length === 0) {
            return;
        }

        console.log(
            `Found ${childApps.length} child app(s) for '${parentAppName}':`
        );

        for (const child of childApps) {
            console.log(
                ` -> Restarting '${child.name}' (pm_id: ${child.pm_id})...`
            );
            await restartAsync(child.pm_id);

            if (childApps.length > 1) {
                await delay(RESTART_DELAY_MS);
            }
        }
    } catch (err) {
        console.error("An error occurred while processing restart event:", err);
    }
}

pm2.connect(function (err) {
    if (err) {
        console.error("Error connecting to PM2:", err);
        process.exit(2);
    }

    pm2.launchBus(function (err, pm2_bus) {
        if (err) {
            console.error("Error launching event bus:", err);
            return;
        }

        console.log("Event bus launched");
        pm2_bus.on("process:event", handleProcessEvent);
    });
});
