const path = require("path");
const fs = require("fs");

/**
 * App Version Policy Endpoint
 * Returns the version policy JSON that controls in-app update prompts in the mobile app.
 * Edit remote-config/app-version.json to trigger or stop prompts without redeploying code.
 */
const getAppVersion = (req, res) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Content-Type", "application/json");

  const configPath = path.join(__dirname, "..", "remote-config", "app-version.json");
  if (fs.existsSync(configPath)) {
    return res.sendFile(configPath);
  }

  // Fallback default policy if file is not found
  return res.json({
    android: { latestVersion: "1.0.0", minimumVersion: "1.0.0" },
    ios: { latestVersion: "1.0.0", minimumVersion: "1.0.0" },
    messages: {
      softTitle: "New Version Available!",
      softMessage: "A new version of GoViLink is ready. Update now for the latest improvements and bug fixes.",
      forceTitle: "Update Required",
      forceMessage: "Your current app version is out of date. Please update to continue using GoViLink.",
      updateButton: "Update Now",
      laterButton: "Update Later"
    }
  });
};

module.exports = {
  getAppVersion,
};
