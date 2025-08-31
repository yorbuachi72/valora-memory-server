import { Request, Response } from 'express';

// Metrics storage (in production, use Redis or database)
interface MetricsData {
  requests: {
    total: number;
    byEndpoint: Record<string, number>;
    byMethod: Record<string, number>;
    responseTimes: number[];
    errors: {
      total: number;
      byStatus: Record<number, number>;
      byEndpoint: Record<string, number>;
    };
  };
  memory: {
    used: number;
    total: number;
    external: number;
  };
  uptime: number;
  lastUpdated: number;
}

class MetricsService {
  private metrics: MetricsData = {
    requests: {
      total: 0,
      byEndpoint: {},
      byMethod: {},
      responseTimes: [],
      errors: {
        total: 0,
        byStatus: {},
        byEndpoint: {},
      },
    },
    memory: {
      used: 0,
      total: 0,
      external: 0,
    },
    uptime: process.uptime(),
    lastUpdated: Date.now(),
  };

  private startTime = Date.now();

  // Record request metrics
  recordRequest(method: string, url: string, statusCode: number, responseTime: number): void {
    this.metrics.requests.total++;

    // Track by method
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;

    // Track by endpoint (simplified)
    const endpoint = url.split('?')[0]; // Remove query parameters
    this.metrics.requests.byEndpoint[endpoint] = (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;

    // Track response times (keep last 1000)
    this.metrics.requests.responseTimes.push(responseTime);
    if (this.metrics.requests.responseTimes.length > 1000) {
      this.metrics.requests.responseTimes.shift();
    }

    // Track errors
    if (statusCode >= 400) {
      this.metrics.requests.errors.total++;
      this.metrics.requests.errors.byStatus[statusCode] = (this.metrics.requests.errors.byStatus[statusCode] || 0) + 1;
      this.metrics.requests.errors.byEndpoint[endpoint] = (this.metrics.requests.errors.byEndpoint[endpoint] || 0) + 1;
    }

    this.metrics.lastUpdated = Date.now();
  }

  // Update memory metrics
  updateMemoryMetrics(): void {
    const memUsage = process.memoryUsage();
    this.metrics.memory.used = memUsage.heapUsed;
    this.metrics.memory.total = memUsage.heapTotal;
    this.metrics.memory.external = memUsage.external;
    this.metrics.uptime = process.uptime();
    this.metrics.lastUpdated = Date.now();
  }

  // Get current metrics
  getMetrics(): MetricsData {
    this.updateMemoryMetrics();
    return { ...this.metrics };
  }

  // Get metrics in Prometheus format
  getPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    const uptime = Math.floor(process.uptime());

    let prometheusOutput = `# HELP valora_requests_total Total number of requests
# TYPE valora_requests_total counter
valora_requests_total ${metrics.requests.total}

# HELP valora_requests_by_method Requests by HTTP method
# TYPE valora_requests_by_method counter
`;

    Object.entries(metrics.requests.byMethod).forEach(([method, count]) => {
      prometheusOutput += `valora_requests_by_method{method="${method}"} ${count}\n`;
    });

    prometheusOutput += `
# HELP valora_requests_by_endpoint Requests by endpoint
# TYPE valora_requests_by_endpoint counter
`;

    Object.entries(metrics.requests.byEndpoint).forEach(([endpoint, count]) => {
      prometheusOutput += `valora_requests_by_endpoint{endpoint="${endpoint}"} ${count}\n`;
    });

    prometheusOutput += `
# HELP valora_response_time_average Average response time in milliseconds
# TYPE valora_response_time_average gauge
`;

    if (metrics.requests.responseTimes.length > 0) {
      const avgResponseTime = metrics.requests.responseTimes.reduce((a, b) => a + b, 0) / metrics.requests.responseTimes.length;
      prometheusOutput += `valora_response_time_average ${avgResponseTime}\n`;
    }

    prometheusOutput += `
# HELP valora_errors_total Total number of error responses
# TYPE valora_errors_total counter
valora_errors_total ${metrics.requests.errors.total}

# HELP valora_memory_used_heap Heap memory used in bytes
# TYPE valora_memory_used_heap gauge
valora_memory_used_heap ${metrics.memory.used}

# HELP valora_memory_total_heap Total heap memory in bytes
# TYPE valora_memory_total_heap gauge
valora_memory_total_heap ${metrics.memory.total}

# HELP valora_uptime_seconds Application uptime in seconds
# TYPE valora_uptime_seconds counter
valora_uptime_seconds ${uptime}
`;

    return prometheusOutput;
  }

  // Get health status
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    memory: {
      used: string;
      total: string;
      usagePercent: number;
    };
    requests: {
      total: number;
      errorRate: number;
      avgResponseTime: number;
    };
    services: {
      tagging: 'up' | 'down';
      storage: 'up' | 'down';
      retrieval: 'up' | 'down';
    };
  } {
    const metrics = this.getMetrics();
    const uptime = Math.floor(process.uptime());

    // Calculate error rate
    const errorRate = metrics.requests.total > 0
      ? (metrics.requests.errors.total / metrics.requests.total) * 100
      : 0;

    // Calculate average response time
    const avgResponseTime = metrics.requests.responseTimes.length > 0
      ? metrics.requests.responseTimes.reduce((a, b) => a + b, 0) / metrics.requests.responseTimes.length
      : 0;

    // Calculate memory usage percentage
    const memoryUsagePercent = metrics.memory.total > 0
      ? (metrics.memory.used / metrics.memory.total) * 100
      : 0;

    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (errorRate > 5 || memoryUsagePercent > 90 || avgResponseTime > 5000) {
      status = 'unhealthy';
    } else if (errorRate > 1 || memoryUsagePercent > 75 || avgResponseTime > 1000) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime,
      memory: {
        used: `${Math.round(metrics.memory.used / 1024 / 1024)}MB`,
        total: `${Math.round(metrics.memory.total / 1024 / 1024)}MB`,
        usagePercent: Math.round(memoryUsagePercent * 100) / 100,
      },
      requests: {
        total: metrics.requests.total,
        errorRate: Math.round(errorRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      },
      services: {
        tagging: 'up', // In mock mode, assume services are up
        storage: 'up',
        retrieval: 'up',
      },
    };
  }
}

// Express middleware for collecting metrics
export const metricsMiddleware = (req: Request, res: Response, next: any) => {
  const startTime = Date.now();

  // Store metrics data on the response object
  (res as any).startTime = startTime;
  (res as any).method = req.method;
  (res as any).url = req.url;

  next();
};

// Function to record metrics (call this after response is sent)
export const recordResponseMetrics = (res: Response) => {
  const startTime = (res as any).startTime;
  const method = (res as any).method;
  const url = (res as any).url;

  if (startTime && method && url) {
    const responseTime = Date.now() - startTime;
    metricsService.recordRequest(method, url, res.statusCode, responseTime);
  }
};

// Global metrics service instance
export const metricsService = new MetricsService();

// Periodic metrics updates
setInterval(() => {
  metricsService.updateMemoryMetrics();
}, 30000); // Update every 30 seconds
