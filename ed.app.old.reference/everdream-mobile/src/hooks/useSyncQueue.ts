import { useEffect, useMemo } from "react";
import * as Network from "expo-network";
import { useShallow } from "zustand/react/shallow";
import { useDreamStore } from "../store/useDreamStore";

function getBackoffDelayMs(retryCount: number) {
  const boundedRetryCount = Math.min(retryCount, 5);
  return Math.min(30000, 1000 * (2 ** boundedRetryCount));
}

export function useSyncQueue() {
  const {
    syncQueue,
    isOnline,
    syncState,
    setOnlineStatus,
    syncPending,
    hydrateLocal,
  } = useDreamStore(useShallow((state) => ({
    syncQueue: state.syncQueue,
    isOnline: state.isOnline,
    syncState: state.syncState,
    setOnlineStatus: state.setOnlineStatus,
    syncPending: state.syncPending,
    hydrateLocal: state.hydrateLocal,
  })));

  const pendingCount = useMemo(
    () => syncQueue.filter((entry) => entry.status === "pending").length,
    [syncQueue],
  );
  const failedEntries = useMemo(
    () => syncQueue.filter((entry) => entry.status === "failed"),
    [syncQueue],
  );

  useEffect(() => {
    void hydrateLocal();
  }, [hydrateLocal]);

  useEffect(() => {
    let mounted = true;

    const bootstrapNetworkState = async () => {
      const state = await Network.getNetworkStateAsync();

      if (!mounted) {
        return;
      }

      const reachable = Boolean(state.isConnected && state.isInternetReachable !== false);
      setOnlineStatus(reachable);

      if (reachable) {
        void syncPending();
      }
    };

    void bootstrapNetworkState();

    const subscription = Network.addNetworkStateListener((state) => {
      const reachable = Boolean(state.isConnected && state.isInternetReachable !== false);
      setOnlineStatus(reachable);

      if (reachable) {
        void syncPending();
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [setOnlineStatus, syncPending]);

  useEffect(() => {
    if (!isOnline || failedEntries.length === 0) {
      return;
    }

    const retryCount = failedEntries.reduce(
      (highest, entry) => Math.max(highest, entry.retry_count),
      0,
    );

    const timeout = setTimeout(() => {
      void syncPending();
    }, getBackoffDelayMs(retryCount));

    return () => clearTimeout(timeout);
  }, [failedEntries, isOnline, syncPending]);

  return {
    isOnline,
    syncState,
    syncQueue,
    pendingCount,
    failedCount: failedEntries.length,
    syncPending,
  };
}
