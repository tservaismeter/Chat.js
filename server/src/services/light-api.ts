/**
 * Light API service - handles zipcode to utility lookups
 */

import { appConfig } from "../config.js";
import { diagnostics } from "../diagnostics.js";

const LIGHT_API_URL = appConfig.lightApiUrl;
const LIGHT_API_KEY = appConfig.lightApiKey;

interface LightUtility {
  name: string;
  display_name: string;
}

interface EligibilityResponse {
  eligibility_likelihood: number;
  utilities: LightUtility[];
}

// Map Light API utility names to Supabase utility codes
// The API returns the name field which we uppercase and look up here
const UTILITY_NAME_MAP: Record<string, string> = {
  "ONCOR": "ONCOR",
  "CENTERPOINT": "CNP",
  "AEP_CENTRAL": "AEP_CENTRAL",
  "AEP_NORTH": "AEP_NORTH",
  "TNMP": "TNMP",
  "LUBBOCK": "LPPL",
};

const DEFAULT_UTILITY_CODE = "ONCOR";

export function initializeLightApiHealth(): void {
  if (!LIGHT_API_KEY) {
    diagnostics.markDependencyDegraded(
      "light_api",
      "LIGHT_API_KEY is not configured; using ONCOR fallback"
    );
    return;
  }

  diagnostics.markDependencyDegraded("light_api", "Configured; awaiting first successful lookup");
}

/**
 * Look up the utility for a given postal code using Light API.
 * Always returns a utility code - defaults to Oncor on any error.
 */
export async function getUtilityForZipcode(postalCode: string): Promise<string> {
  if (!LIGHT_API_KEY) {
    const message = "[Light API] LIGHT_API_KEY not set, defaulting to Oncor";
    console.warn(message);
    diagnostics.markDependencyDegraded(
      "light_api",
      "LIGHT_API_KEY missing during runtime; using ONCOR fallback"
    );
    return DEFAULT_UTILITY_CODE;
  }

  try {
    const response = await fetch(`${LIGHT_API_URL}/v1/app/accounts/enroll/eligibility`, {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LIGHT_API_KEY}`,
      },
      body: JSON.stringify({ postal_code: postalCode }),
    });

    if (!response.ok) {
      const message = `HTTP ${response.status}`;
      console.error(`[Light API] Error: ${message}, defaulting to Oncor`);
      diagnostics.markDependencyDown(
        "light_api",
        message,
        "Light API request failed"
      );
      return DEFAULT_UTILITY_CODE;
    }

    const data: EligibilityResponse = await response.json();

    if (!data.utilities?.length) {
      console.warn(`[Light API] No utilities for ${postalCode}, defaulting to Oncor`);
      diagnostics.markDependencyDegraded(
        "light_api",
        `No utilities returned for postal code ${postalCode}`
      );
      return DEFAULT_UTILITY_CODE;
    }

    // Use first utility (primary for this zipcode)
    const primaryName = data.utilities[0].name.toUpperCase();
    const utilityCode = UTILITY_NAME_MAP[primaryName];

    if (!utilityCode) {
      console.warn(`[Light API] Unknown utility "${primaryName}", defaulting to Oncor`);
      diagnostics.markDependencyDegraded(
        "light_api",
        `Unknown utility from Light API: ${primaryName}`
      );
      return DEFAULT_UTILITY_CODE;
    }

    diagnostics.markDependencyOk("light_api", `Lookup succeeded for postal code ${postalCode}`);
    return utilityCode;
  } catch (err) {
    console.error("[Light API] Request failed, defaulting to Oncor:", err);
    diagnostics.markDependencyDown("light_api", err, "Light API request threw");
    return DEFAULT_UTILITY_CODE;
  }
}
