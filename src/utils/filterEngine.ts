import type { GlobalFilters, Client, CurrentUser } from '../types';
import { clients } from '../data/mock';

export function getFilteredClients(filters: GlobalFilters, user: CurrentUser): Client[] {
  let result = [...clients];

  // Role-based pre-filter
  if (user.role === 'csm') {
    result = result.filter(c => c.csm_owner_id === user.csm_owner_id);
  } else if (filters.csmOwner) {
    result = result.filter(c => c.csm_owner_id === filters.csmOwner);
  }

  if (filters.clients.length > 0) {
    result = result.filter(c => filters.clients.includes(c.client_id));
  }
  if (filters.regions.length > 0) {
    result = result.filter(c => filters.regions.includes(c.region));
  }
  if (filters.countries.length > 0) {
    result = result.filter(c => filters.countries.includes(c.country));
  }
  if (filters.businessUnits.length > 0) {
    result = result.filter(c => filters.businessUnits.includes(c.business_unit));
  }

  return result;
}
