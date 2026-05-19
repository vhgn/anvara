const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

export type RoleData =
  | {
      role: 'sponsor';
      sponsorId: string;
      name: string;

      publisherId?: undefined;
    }
  | {
      role: 'publisher';
      publisherId: string;
      name: string;

      sponsorId?: undefined;
    }
  | {
      role: null;

      name?: undefined;
      sponsorId?: undefined;
      publisherId?: undefined;
    };

/**
 * Fetch user role from the backend based on userId.
 * Returns role info including sponsorId/publisherId if applicable.
 */
export async function getUserRole(userId: string): Promise<RoleData> {
  try {
    const res = await fetch(`${API_URL}/api/auth/role/${userId}`, {
      cache: 'no-store', // Always fetch fresh role data
    });
    if (!res.ok) {
      return { role: null };
    }
    return await res.json();
  } catch {
    return { role: null };
  }
}
