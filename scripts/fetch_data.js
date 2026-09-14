import "dotenv/config";
import fs from "fs";

const BASE_URL = process.env.BASE_URL;
const API_KEY = process.env.API_KEY;
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

async function login() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  console.log("Login successful");

  return data.access_token;
}
async function fetchListings(token) {
  const allListings = [];
  const limit = 50;
  let offset = 0;

  while (true) {
    const response = await fetch(
      `${BASE_URL}/v1/listings?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": API_KEY,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Listings request failed at offset ${offset}: ${response.status}`
      );
    }

    allListings.push(...data.results);

    console.log(
      `Fetched ${data.results.length} records | offset=${offset} | total=${data.total}`
    );

    if (!data.has_more) {
      break;
    }

    offset += data.results.length;
  }

  console.log("Total records fetched:", allListings.length);

const uniqueIds = new Set(
  allListings.map((listing) => listing.listing_id)
);

console.log("Unique listing IDs:", uniqueIds.size);

fs.writeFileSync(
  "data/listings.json",
  JSON.stringify(allListings, null, 2)
);

console.log("Saved to data/listings.json");

return allListings;
}

async function main() {
  const token = await login();
  await fetchListings(token);
}

main().catch((error) => {
  console.error("Error:", error.message);
});