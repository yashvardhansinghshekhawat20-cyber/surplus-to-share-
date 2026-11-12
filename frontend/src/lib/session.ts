import { apiPost } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

/** Call after a successful login/register: refetches "me" and every dashboard query. */
export async function beginSession() {
  await queryClient.invalidateQueries();
}

/** Every sign-out control must go through here — clears the server cookie AND the
 * react-query cache so the next login on this browser never sees stale account data. */
export async function endSession() {
  try {
    await apiPost("/auth/logout");
  } finally {
    queryClient.clear();
  }
}
