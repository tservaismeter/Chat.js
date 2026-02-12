/**
 * Lightweight runtime diagnostics for production visibility.
 */

type DependencyName = "supabase" | "light_api";
type DependencyStatus = "unknown" | "ok" | "degraded" | "down";
type OverallStatus = "ok" | "degraded" | "down";

type DependencyState = {
  status: DependencyStatus;
  message: string;
  lastCheckedAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  consecutiveFailures: number;
};

type Incident = {
  at: string;
  source: string;
  message: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

class DiagnosticsStore {
  private readonly startedAt = Date.now();
  private readonly maxIncidents = 20;
  private readonly incidents: Incident[] = [];

  private readonly dependencies: Record<DependencyName, DependencyState> = {
    supabase: {
      status: "unknown",
      message: "Not checked yet",
      consecutiveFailures: 0,
    },
    light_api: {
      status: "unknown",
      message: "Not checked yet",
      consecutiveFailures: 0,
    },
  };

  recordIncident(source: string, error: unknown): void {
    const incident: Incident = {
      at: nowIso(),
      source,
      message: toMessage(error),
    };
    this.incidents.unshift(incident);
    if (this.incidents.length > this.maxIncidents) {
      this.incidents.length = this.maxIncidents;
    }
  }

  markDependencyOk(name: DependencyName, message = "ok"): void {
    const timestamp = nowIso();
    const state = this.dependencies[name];
    state.status = "ok";
    state.message = message;
    state.lastCheckedAt = timestamp;
    state.lastSuccessAt = timestamp;
    state.consecutiveFailures = 0;
  }

  markDependencyDegraded(name: DependencyName, message: string): void {
    const timestamp = nowIso();
    const state = this.dependencies[name];
    state.status = "degraded";
    state.message = message;
    state.lastCheckedAt = timestamp;
  }

  markDependencyDown(name: DependencyName, error: unknown, prefix?: string): void {
    const timestamp = nowIso();
    const state = this.dependencies[name];
    const detail = toMessage(error);
    state.status = "down";
    state.message = prefix ? `${prefix}: ${detail}` : detail;
    state.lastCheckedAt = timestamp;
    state.lastFailureAt = timestamp;
    state.consecutiveFailures += 1;
  }

  getSnapshot(): {
    status: OverallStatus;
    startedAt: string;
    uptimeSeconds: number;
    dependencies: Record<DependencyName, DependencyState>;
    recentIncidents: Incident[];
  } {
    const dependencyList = Object.values(this.dependencies);
    let status: OverallStatus = "ok";
    if (dependencyList.some((dep) => dep.status === "down")) {
      status = "down";
    } else if (dependencyList.some((dep) => dep.status !== "ok")) {
      status = "degraded";
    }

    return {
      status,
      startedAt: new Date(this.startedAt).toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      dependencies: {
        supabase: { ...this.dependencies.supabase },
        light_api: { ...this.dependencies.light_api },
      },
      recentIncidents: [...this.incidents],
    };
  }
}

export const diagnostics = new DiagnosticsStore();
