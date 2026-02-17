// gen_totp.js (no dependencies)
// usage: node gen_totp.js BASE32SECRET

const crypto = require("crypto");

function base32ToBuffer(base32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  const cleaned = String(base32 || "").toUpperCase().replace(/=+$/g, "").replace(/[^A-Z2-7]/g, "");
  for (const c of cleaned) {
    const val = alphabet.indexOf(c);
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function totp(secretBase32, step = 30, digits = 6) {
  const key = base32ToBuffer(secretBase32);
  const counter = Math.floor(Date.now() / 1000 / step);

  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac("sha1", key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (code % 10 ** digits).toString().padStart(digits, "0");
  return otp;
}

const secret = process.argv[2];
if (!secret) {
  console.error("Usage: node gen_totp.js BASE32SECRET");
  process.exit(1);
}

process.stdout.write(totp(secret));
