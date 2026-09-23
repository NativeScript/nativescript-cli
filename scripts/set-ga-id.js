const fs = require("fs");
const path = require("path");
const EOL = require("os").EOL;

// a real environment always wins over .env, so CI secrets are never shadowed
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});

// GA4 measurement ids (G-XXXXXXXXXX). Leaving these empty disables analytics in
// the produced build - the provider skips every hit when either value is unset.
const GA_MEASUREMENT_IDS = {
  dev: "",
  live: "G-T4P12SN9HJ",
};

// The api secret pairs with the measurement id and is a credential, so it is
// read from the environment at release time rather than committed here.
const API_SECRET_ENV = {
  dev: "GA_API_SECRET_DEV",
  live: "GA_API_SECRET",
};

const MEASUREMENT_ID_KEY = "GA_MEASUREMENT_ID";
const API_SECRET_KEY = "GA_API_SECRET";
const rootDir = path.join(__dirname, "..");

// Releases flip the id inside dist/ rather than in the working tree, so a failed
// pack cannot leave a checkout configured to report as production.
const dirIndex = process.argv.indexOf("--dir");
const baseDir =
  dirIndex === -1 ? rootDir : path.resolve(rootDir, process.argv[dirIndex + 1]);
const configPath = path.join(baseDir, "config", "config.json");

function readConfig() {
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

const mode = process.argv[2];

if (mode === "verify") {
  const config = readConfig();

  if (!GA_MEASUREMENT_IDS.live) {
    console.warn(
      `Warning: no GA4 measurement id is configured in ${__filename}, so this build reports no analytics.`
    );
  } else if (config[MEASUREMENT_ID_KEY] !== GA_MEASUREMENT_IDS.live) {
    throw new Error(
      `Google Analytics measurement id is not configured correctly in ${configPath}`
    );
  } else if (!config[API_SECRET_KEY]) {
    // not fatal: the provider skips every hit without it, so the build is sound
    // and merely reports nothing - the same state a release ships today
    console.warn(
      `Warning: $${API_SECRET_ENV.live} is not set, so this build reports no analytics.`
    );
  }
} else if (mode === "live" || mode === "dev") {
  const config = readConfig();
  config[MEASUREMENT_ID_KEY] = GA_MEASUREMENT_IDS[mode];
  config[API_SECRET_KEY] = process.env[API_SECRET_ENV[mode]] || "";
  fs.writeFileSync(configPath, JSON.stringify(config, null, "\t") + EOL);
} else {
  console.error(
    "Usage: node scripts/set-ga-id.js <live|dev|verify> [--dir <path>]"
  );
  process.exit(1);
}
