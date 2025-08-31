import express, { Request, Response } from 'express';
import { metricsService, metricsMiddleware } from './metrics.js';
import { createHealthRoutes } from './health.js';

// Create monitoring router
const monitoringRouter = express.Router();

// Apply metrics middleware to all monitoring routes
monitoringRouter.use(metricsMiddleware);

// Health check endpoints
const healthRoutes = createHealthRoutes();

// Comprehensive health check
monitoringRouter.get('/health', healthRoutes.healthCheck);

// Simple health check for load balancers
monitoringRouter.get('/health/simple', healthRoutes.simpleHealthCheck);

// Readiness check (for Kubernetes)
monitoringRouter.get('/health/ready', healthRoutes.readinessCheck);

// Metrics endpoints
monitoringRouter.get('/metrics', (req: Request, res: Response) => {
  try {
    const metrics = metricsService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Prometheus metrics endpoint
monitoringRouter.get('/metrics/prometheus', (req: Request, res: Response) => {
  try {
    const prometheusMetrics = metricsService.getPrometheusMetrics();
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(prometheusMetrics);
  } catch (error) {
    res.status(500).set('Content-Type', 'text/plain').send(`# Error retrieving metrics\nerror="${error instanceof Error ? error.message : String(error)}"\n`);
  }
});

// System information endpoint
monitoringRouter.get('/system', (req: Request, res: Response) => {
  try {
    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT || process.env.VALORA_PORT,
        branding: process.env.VALORA_BRAND,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(systemInfo);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve system information',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Performance metrics endpoint
monitoringRouter.get('/performance', (req: Request, res: Response) => {
  try {
    const metrics = metricsService.getMetrics();
    const performance = {
      uptime: Math.floor(process.uptime()),
      memory: {
        used: `${Math.round(metrics.memory.used / 1024 / 1024)}MB`,
        total: `${Math.round(metrics.memory.total / 1024 / 1024)}MB`,
        usagePercent: Math.round((metrics.memory.used / metrics.memory.total) * 10000) / 100,
      },
      requests: {
        total: metrics.requests.total,
        averageResponseTime: metrics.requests.responseTimes.length > 0
          ? Math.round(metrics.requests.responseTimes.reduce((a, b) => a + b, 0) / metrics.requests.responseTimes.length * 100) / 100
          : 0,
        errorRate: metrics.requests.total > 0
          ? Math.round((metrics.requests.errors.total / metrics.requests.total) * 10000) / 100
          : 0,
        requestsPerSecond: metrics.requests.total > 0
          ? Math.round((metrics.requests.total / process.uptime()) * 100) / 100
          : 0,
      },
      topEndpoints: Object.entries(metrics.requests.byEndpoint)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count })),
      timestamp: new Date().toISOString(),
    };

    res.json(performance);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve performance metrics',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Configuration endpoint (safe - no secrets)
monitoringRouter.get('/config', (req: Request, res: Response) => {
  try {
    const config = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT || process.env.VALORA_PORT,
        branding: process.env.VALORA_BRAND,
        corsOrigins: process.env.ALLOWED_ORIGINS,
      },
      features: {
        encryption: true,
        rateLimiting: true,
        authentication: true,
        tagging: true,
        webhooks: true,
      },
      limits: {
        maxRequestSize: '10MB',
        rateLimitWindow: '15 minutes',
        rateLimitMax: 50,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(config);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve configuration',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export { monitoringRouter, metricsMiddleware };
