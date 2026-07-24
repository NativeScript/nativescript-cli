const fs = require("fs");
const path = require("path");
const EOL = require("os").EOL;

const GA_TRACKING_IDS = {
  dev: "UA-111455-51",
  live: "UA-111455-44",
};

const GA_KEY = "GA_TRACKING_ID";
const configPath = path.join(__dirname, "..", "config", "config.json");

function readConfig() {
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

const mode = process.argv[2];

if (mode === "verify") {
  if (readConfig()[GA_KEY] !== GA_TRACKING_IDS.live) {
    throw new Error("Google Analytics id is not configured correctly.");
  }
} else if (mode === "live" || mode === "dev") {
  const config = readConfig();
  config[GA_KEY] = GA_TRACKING_IDS[mode];
  fs.writeFileSync(configPath, JSON.stringify(config, null, "\t") + EOL);
} else {
  console.error("Usage: node scripts/set-ga-id.js <live|dev|verify>");
  process.exit(1);
}
