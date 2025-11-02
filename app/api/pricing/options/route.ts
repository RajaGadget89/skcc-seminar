import { NextRequest, NextResponse } from "next/server";
import { DynamicPricingCalculator } from "../../../lib/dynamicPricingCalculator";
import { withAuditLogging } from "../../../lib/audit/withAuditAccess";

/**
 * GET /api/pricing/options
 * Get available hotel choices and room types based on current time and configuration
 *
 * Query parameters:
 * - currentTime: ISO string (optional, defaults to now)
 *
 * Returns:
 * - hotelChoices: Array of available hotel choice values
 * - roomTypes: Array of available room type values
 */
export const GET = withAuditLogging(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const currentTimeParam = url.searchParams.get("currentTime");

    // Parse current time
    const currentTime = currentTimeParam
      ? new Date(currentTimeParam)
      : new Date();
    if (currentTimeParam && isNaN(currentTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid currentTime format. Must be ISO string" },
        { status: 400 },
      );
    }

    // Get available options based on current time
    const options =
      await DynamicPricingCalculator.getAvailableOptions(currentTime);

    return NextResponse.json(options);
  } catch (error) {
    console.error("[PRICING_OPTIONS_API] Error:", error);

    if (error instanceof Error) {
      // If it's a database/configuration error, return default empty options
      // This allows the landing page to still function when settings aren't configured
      if (
        error.message.includes("Event settings") ||
        error.message.includes("Pricing configuration") ||
        error.message.includes("Failed to fetch event settings")
      ) {
        console.warn(
          "[PRICING_OPTIONS_API] Event settings not configured, returning default options",
        );
        return NextResponse.json({
          hotelChoices: ["no-accommodation"],
          roomTypes: [],
          allowInQuotaAfterEarlyBird: false,
          isEarlyBird: false,
        });
      }

      return NextResponse.json(
        {
          error: error.message,
          code: "OPTIONS_FETCH_ERROR",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
});
