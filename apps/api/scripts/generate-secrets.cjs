
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const readline = require("node:readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter your chosen Gallery owner password: ", (password) => {
  if (password.length < 12) {
    console.error("Use a password with at least 12 characters.");
    rl.close();
    process.exitCode = 1;
    return;
  }

  console.log("\nOWNER_PASSWORD_HASH=" + bcrypt.hashSync(password, 12));
  console.log("JWT_SECRET=" + crypto.randomBytes(48).toString("hex"));
  rl.close();
});
