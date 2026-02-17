const speakeasy = require("speakeasy");

const secret = process.env.TOTP_SECRET_BASE32;

if (!secret) {
  console.error("Missing TOTP_SECRET_BASE32");
  process.exit(1);
}

const token = speakeasy.totp({
  secret,
  encoding: "base32"
});

process.stdout.write(token);
