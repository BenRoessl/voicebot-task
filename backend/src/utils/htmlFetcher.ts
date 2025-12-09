import axios from "axios";
import { logger } from "./logger";

export async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await axios.get<string>(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "VoicebotCrawler/1.0 (+test-task)",
      },
      maxRedirects: 5,
    });

    if (typeof response.data !== "string") {
      throw new Error("Response data is not a string.");
    }

    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch HTML from url: ${url}`, error);
    throw new Error(`Could not fetch HTML from url: ${url}`);
  }
}
