import { getCompanies } from "./_actions/companies.actions";
import { CompaniesPageClient } from "./_components/companies-page-client";

// ========================================
// SERVER COMPONENT - DATA FETCHING
// ========================================

export default async function CompaniesPage() {
  // Fetch data on server - no client-side fetching needed!
  const result = await getCompanies();

  return (
    <CompaniesPageClient
      initialCompanies={result.success ? result.data : []}
      initialError={!result.success ? result.error : null}
    />
  );
}
