"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { OrderStatus } from "@prisma/client";

export interface KitchenOrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions: string | null;
}

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  totalAmount: number;
  customer: {
    name: string;
    phone: string;
    studentId: string | null;
    department: string | null;
  };
  destination: {
    type: string;
    title: string;
    detail: string;
    landmark: string | null;
  };
  smartQueue: {
    queuePosition: string | null;
    queueRank: number | null;
    waitingTimeSeconds: number;
    waitingTimeFormatted: string;
    isDelayed: boolean;
    estimatedPrepTimeMinutes: number;
  };
  items: KitchenOrderItem[];
  totalItemCount: number;
}

export interface KitchenData {
  staff: {
    id: string;
    name: string;
    role: string;
  };
  counts: {
    totalActive: number;
    new: number;
    confirmed: number;
    preparing: number;
    ready: number;
    completed: number;
  };
  telemetry: {
    avgWaitMinutes: number;
    longestWaitMinutes: number;
  };
  orders: {
    newOrders: KitchenOrder[];
    confirmed: KitchenOrder[];
    preparing: KitchenOrder[];
    ready: KitchenOrder[];
    completed: KitchenOrder[];
  };
}

// Web Audio API Chime Synthesizer
function playNewOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Two-tone friendly chime (880Hz -> 1320Hz)
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.15); // E6

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(660, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch {
    // Audio context may be restricted by browser until first user gesture
  }
}

interface UseKitchenOrdersOptions {
  pollIntervalMs?: number;
  autoRefresh?: boolean;
  soundEnabled?: boolean;
}

export function useKitchenOrders(options: UseKitchenOrdersOptions = {}) {
  const { pollIntervalMs = 4000, autoRefresh = true, soundEnabled = true } = options;

  const [data, setData] = useState<KitchenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<Record<string, boolean>>({});

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  const fetchOrders = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    try {
      const res = await fetch("/api/kitchen/orders", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Unauthorized. Kitchen staff access required.");
        }
        throw new Error(`Failed to fetch kitchen orders (${res.status})`);
      }
      const json = await res.json();
      const freshOrders: KitchenOrder[] = json.orders.newOrders || [];

      // Detect newly arrived orders for chime alert
      if (initialLoadDoneRef.current && soundEnabled) {
        const hasNewOrder = freshOrders.some(
          (o) => !knownOrderIdsRef.current.has(o.id)
        );
        if (hasNewOrder) {
          playNewOrderChime();
        }
      }

      // Update known set
      const allFetchedIds = new Set<string>();
      Object.values(json.orders).forEach((list: any) => {
        if (Array.isArray(list)) {
          list.forEach((o: any) => allFetchedIds.add(o.id));
        }
      });
      knownOrderIdsRef.current = allFetchedIds;
      initialLoadDoneRef.current = true;

      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to connect to kitchen queue.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [soundEnabled]);

  // Polling loop with visibility change detection
  useEffect(() => {
    fetchOrders();

    if (!autoRefresh) return;

    let timer: NodeJS.Timeout | null = null;

    const startTimer = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (document.visibilityState === "visible") {
          fetchOrders(false);
        }
      }, pollIntervalMs);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchOrders(true);
        startTimer();
      } else if (timer) {
        clearInterval(timer);
      }
    };

    startTimer();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchOrders, autoRefresh, pollIntervalMs]);

  // Status transition action handler
  const transitionOrderStatus = useCallback(
    async (orderId: string, nextStatus: OrderStatus, note?: string): Promise<boolean> => {
      setActionInProgress((prev) => ({ ...prev, [orderId]: true }));
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus, note }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to update status to ${nextStatus}`);
        }

        // Immediately re-fetch to synchronize state
        await fetchOrders(false);
        return true;
      } catch (err: any) {
        alert(err.message || "Action failed.");
        return false;
      } finally {
        setActionInProgress((prev) => ({ ...prev, [orderId]: false }));
      }
    },
    [fetchOrders]
  );

  // High-level action methods
  const acceptOrder = useCallback(
    (orderId: string) => transitionOrderStatus(orderId, OrderStatus.CONFIRMED, "Accepted by kitchen staff"),
    [transitionOrderStatus]
  );

  const startPreparing = useCallback(
    (orderId: string) => transitionOrderStatus(orderId, OrderStatus.PREPARING, "Cooking started"),
    [transitionOrderStatus]
  );

  const markReady = useCallback(
    (orderId: string) => transitionOrderStatus(orderId, OrderStatus.READY_FOR_PICKUP, "Food packaged and ready"),
    [transitionOrderStatus]
  );

  const completeOrder = useCallback(
    (orderId: string) => transitionOrderStatus(orderId, OrderStatus.DELIVERED, "Completed / Handed over to student"),
    [transitionOrderStatus]
  );

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    actionInProgress,
    refresh: () => fetchOrders(true),
    acceptOrder,
    startPreparing,
    markReady,
    completeOrder,
  };
}
