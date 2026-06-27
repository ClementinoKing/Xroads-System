export function isNetworkErrorMessage(message?: string | null) {
  if (!message) {
    return false;
  }

  return /failed to fetch|load failed|networkerror|network request failed|err_internet_disconnected|err_name_not_resolved|err_network|fetch failed/i.test(message);
}

export function toConnectivityError(action: string) {
  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;

  return isOffline
    ? `You appear to be offline. Reconnect to the internet and try to ${action} again.`
    : `We could not reach Supabase. Check your internet connection and try to ${action} again.`;
}
