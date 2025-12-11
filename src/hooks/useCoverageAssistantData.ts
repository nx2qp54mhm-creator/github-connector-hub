// src/hooks/useCoverageAssistantData.ts

import { useMemo } from "react";
import { CoverageCard, CoveragePolicy } from "@/services/coverageAssistant";

/**
 * Transforms your app's credit card and policy data into the format
 * expected by the Coverage Assistant API.
 * 
 * IMPORTANT: Adjust the field mappings below to match your actual data structure!
 */
export function useCoverageAssistantData(
  userCards: any[],
  userPolicies: any[]
) {
  const formattedCards: CoverageCard[] = useMemo(() => {
    if (!userCards || userCards.length === 0) return [];

    return userCards.map((card) => {
      // Adjust these mappings based on your actual data structure
      // This assumes you're storing the full card data from your JSON
      const rentalCoverage = card.rental_car_coverage || {};

      return {
        card_name: card.card_name || card.name,
        issuer: card.issuer,
        coverage_type: rentalCoverage.coverage_type,
        max_coverage_amount: rentalCoverage.max_coverage_amount,
        what_is_covered: rentalCoverage.what_is_covered,
        what_is_not_covered: rentalCoverage.what_is_not_covered,
        vehicle_exclusions: rentalCoverage.vehicle_exclusions,
        exotic_vehicle_coverage: rentalCoverage.exotic_vehicle_coverage,
        country_exclusions: rentalCoverage.country_exclusions,
        activation_requirements: rentalCoverage.activation_requirements,
      };
    });
  }, [userCards]);

  const formattedPolicies: CoveragePolicy[] = useMemo(() => {
    if (!userPolicies || userPolicies.length === 0) return [];

    return userPolicies.map((policy) => {
      // Adjust these mappings based on your parsed document structure
      return {
        policy_name: policy.name || policy.policy_name || "Uploaded Policy",
        policy_type: policy.type || policy.policy_type || "Insurance",
        coverage_details: policy.coverage_details || policy.summary,
        deductible: policy.deductible,
        limits: policy.limits || policy.coverage_limits,
      };
    });
  }, [userPolicies]);

  return {
    formattedCards,
    formattedPolicies,
    totalItems: formattedCards.length + formattedPolicies.length,
  };
}
