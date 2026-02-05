import { chromium } from "playwright";

interface CardData {
  name: string;
  color: string;
  rarity: string;
  iwd: number;
  winRate: number;
  gamesPlayed: number;
}

async function scrape17LandsData(
  setCode: string,
  format: string = "PremierDraft",
  startDate: string = "2024-01-01"
): Promise<CardData[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://www.17lands.com/card_data?expansion=${setCode}&format=${format}&start=${startDate}`;
  console.log(`Fetching: ${url}`);

  await page.goto(url, { waitUntil: "networkidle" });

  // Wait for the table to load
  await page.waitForSelector("table", { timeout: 30000 });

  // Extract data from the table
  const cards = await page.evaluate(() => {
    const rows = document.querySelectorAll("table tbody tr");
    const data: CardData[] = [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length >= 10) {
        // Find the IWD column - it's usually labeled "IWD" or "Drawn IWD"
        const name = cells[0]?.textContent?.trim() || "";
        const color = cells[1]?.textContent?.trim() || "";
        const rarity = cells[2]?.textContent?.trim() || "";

        // Find columns by header text (more reliable)
        const headerRow = document.querySelector("table thead tr");
        const headers = Array.from(headerRow?.querySelectorAll("th") || []).map(
          (th) => th.textContent?.trim() || ""
        );

        const iwdIndex = headers.findIndex(
          (h) => h.includes("IWD") || h.includes("Drawn Improvement")
        );
        const winRateIndex = headers.findIndex(
          (h) => h === "GIH WR" || h.includes("Win Rate")
        );
        const gamesIndex = headers.findIndex(
          (h) => h === "# GIH" || h.includes("Games")
        );

        const parsePercent = (text: string): number => {
          const match = text.match(/-?[\d.]+/);
          return match ? parseFloat(match[0]) / 100 : 0;
        };

        const parseInt2 = (text: string): number => {
          const match = text.replace(/,/g, "").match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        };

        if (name && iwdIndex >= 0) {
          data.push({
            name,
            color,
            rarity,
            iwd: parsePercent(cells[iwdIndex]?.textContent || "0"),
            winRate: parsePercent(cells[winRateIndex]?.textContent || "0"),
            gamesPlayed: parseInt2(cells[gamesIndex]?.textContent || "0"),
          });
        }
      }
    });

    return data;
  });

  await browser.close();
  return cards;
}

// Run the scraper
const setCode = process.argv[2] || "BLB";
const format = process.argv[3] || "PremierDraft";
const startDate = process.argv[4] || "2024-07-30";

scrape17LandsData(setCode, format, startDate)
  .then((cards) => {
    console.log(`Found ${cards.length} cards`);
    console.log(JSON.stringify(cards, null, 2));
  })
  .catch(console.error);
