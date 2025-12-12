/**
 * Light API service - handles zipcode to utility lookups
 */

const LIGHT_API_URL = process.env.LIGHT_API_URL ?? "https://api.light.dev";
const LIGHT_API_KEY = process.env.LIGHT_API_KEY;

interface LightUtility {
  name: string;
  display_name: string;
}

interface EligibilityResponse {
  eligibility_likelihood: number;
  utilities: LightUtility[];
}

// Map Light API names to Supabase utility codes (must match utilities.code in database)
const UTILITY_NAME_MAP: Record<string, string> = {
  "ONCOR": "ONCOR",
  "CENTERPOINT": "CNP",
  "TNMP": "TNMP",
  "AEP CENTRAL": "AEP_CENTRAL",
  "AEP NORTH": "AEP_NORTH",
  "LUBBOCK POWER & LIGHT": "LPPL",
};

const DEFAULT_UTILITY_CODE = "ONCOR";

/**
 * Look up the utility for a given postal code using Light API.
 * Always returns a utility code - defaults to Oncor on any error.
 */
export async function getUtilityForZipcode(postalCode: string): Promise<string> {
  if (!LIGHT_API_KEY) {
    console.warn("LIGHT_API_KEY not set, defaulting to Oncor");
    return DEFAULT_UTILITY_CODE;
  }

  try {
    const response = await fetch(`${LIGHT_API_URL}/v1/app/accounts/enroll/eligibility`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LIGHT_API_KEY}`,
      },
      body: JSON.stringify({ postal_code: postalCode }),
    });

    if (!response.ok) {
      console.error(`Light API error: ${response.status}, defaulting to Oncor`);
      return DEFAULT_UTILITY_CODE;
    }

    const data: EligibilityResponse = await response.json();

    if (!data.utilities?.length) {
      console.warn(`No utilities for ${postalCode}, defaulting to Oncor`);
      return DEFAULT_UTILITY_CODE;
    }

    // Use first utility (primary for this zipcode)
    const primaryName = data.utilities[0].name.toUpperCase();
    const utilityCode = UTILITY_NAME_MAP[primaryName];

    if (!utilityCode) {
      console.warn(`Unknown utility "${primaryName}", defaulting to Oncor`);
      return DEFAULT_UTILITY_CODE;
    }

    return utilityCode;
  } catch (err) {
    console.error("Light API request failed, defaulting to Oncor:", err);
    return DEFAULT_UTILITY_CODE;
  }
}
