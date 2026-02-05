import { chromium } from "playwright";

const setCode = process.argv[2] || "BLB";
const format = process.argv[3] || "PremierDraft";
const startDate = process.argv[4] || "2024-07-30";

async function main() {
  console.log(`Scraping ${setCode} ${format} from ${startDate}...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let cardData = null;

  // Log ALL requests to find the data endpoint
  page.on("request", (request) => {
    const url = request.url();
    if (!url.includes(".js") && !url.includes(".css") && !url.includes(".png") && !url.includes(".ico")) {
      console.log(`REQUEST: ${request.method()} ${url}`);
    }
  });

  // Intercept API responses
  page.on("response", async (response) => {
    const url = response.url();
    const contentType = response.headers()["content-type"] || "";

    if (contentType.includes("json")) {
      console.log(`JSON RESPONSE: ${url}`);
      try {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          console.log(`  -> Array with ${data.length} items`);
          if (data[0].name) {
            console.log(`  -> Has 'name' field, first: ${data[0].name}`);
            console.log(`  -> Sample keys: ${Object.keys(data[0]).slice(0, 10).join(", ")}`);
            cardData = data;
          }
        }
      } catch (e) {
        // Not JSON or parse error
      }
    }
  });

  const url = `https://www.17lands.com/card_data?expansion=${setCode}&format=${format}&start=${startDate}`;
  console.log(`\nLoading: ${url}\n`);

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  // Wait for data to load
  await page.waitForTimeout(5000);

  await browser.close();

  if (cardData) {
    const cardsWithIwd = cardData.filter(c =>
      c.drawn_improvement_win_rate !== null &&
      c.ever_drawn_game_count > 0
    );
    console.log(`\n=== RESULTS ===`);
    console.log(`Total cards: ${cardData.length}`);
    console.log(`Cards with IWD data: ${cardsWithIwd.length}`);

    if (cardsWithIwd.length > 0) {
      console.log(`\nSample card:`);
      console.log(JSON.stringify(cardsWithIwd[0], null, 2));
    }
  } else {
    console.log("\nNo card data captured from API responses");
  }
}

main().catch(console.error);
