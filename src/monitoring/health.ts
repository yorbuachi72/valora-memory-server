import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { metricsService } from './metrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Health check configuration
interface HealthCheckConfig {
  checks: {
    database: boolean;
    fileSystem: boolean;
    memory: boolean;
    diskSpace: boolean;
  };
  thresholds: {
    maxMemoryUsage: number; // percentage
    minDiskSpace: number; // MB
    maxResponseTime: number; // milliseconds
    maxErrorRate: number; // percentage
  };
}

const defaultConfig: HealthCheckConfig = {
  checks: {
    database: true,
    fileSystem: true,
    memory: true,
    diskSpace: true,
  },
  thresholds: {
    maxMemoryUsage: 90, // 90%
    minDiskSpace: 100, // 100MB
    maxResponseTime: 5000, // 5 seconds
    maxErrorRate: 5, // 5%
  },
};

class HealthCheckService {
  private config: HealthCheckConfig;

  constructor(config: Partial<HealthCheckConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Comprehensive health check
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    checks: Record<string, {
      status: 'pass' | 'fail' | 'warn';
      message: string;
      details?: any;
    }>;
  }> {
    const checks: Record<string, { status: 'pass' | 'fail' | 'warn'; message: string; details?: any }> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Database connectivity check
    if (this.config.checks.database) {
      try {
        const dbPath = path.resolve(__dirname, '../../../.valora/db.json');
        const dbExists = fs.existsSync(dbPath);

        if (dbExists) {
          const stats = fs.statSync(dbPath);
          checks.database = {
            status: 'pass',
            message: 'Database file exists and is accessible',
            details: {
              size: `${Math.round(stats.size / 1024)}KB`,
              modified: stats.mtime.toISOString(),
            },
          };
        } else {
          checks.database = {
            status: 'warn',
            message: 'Database file does not exist (will be created on first use)',
          };
        }
      } catch (error) {
        checks.database = {
          status: 'fail',
          message: 'Database check failed',
          details: { error: error instanceof Error ? error.message : String(error) },
        };
        overallStatus = 'unhealthy';
      }
    }

    // File system permissions check
    if (this.config.checks.fileSystem) {
      try {
        const testFile = path.resolve(__dirname, '../../../.valora/health-test.tmp');
        fs.writeFileSync(testFile, 'health-check');
        fs.unlinkSync(testFile);

        checks.fileSystem = {
          status: 'pass',
          message: 'File system read/write permissions OK',
        };
      } catch (error) {
        checks.fileSystem = {
          status: 'fail',
          message: 'File system permissions check failed',
          details: { error: error instanceof Error ? error.message : String(error) },
        };
        overallStatus = 'unhealthy';
      }
    }

    // Memory usage check
    if (this.config.checks.memory) {
      const metrics = metricsService.getMetrics();
      const memoryUsagePercent = (metrics.memory.used / metrics.memory.total) * 100;

      if (memoryUsagePercent > this.config.thresholds.maxMemoryUsage) {
        checks.memory = {
          status: 'fail',
          message: `Memory usage too high: ${memoryUsagePercent.toFixed(1)}%`,
          details: {
            used: `${Math.round(metrics.memory.used / 1024 / 1024)}MB`,
            total: `${Math.round(metrics.memory.total / 1024 / 1024)}MB`,
            usagePercent: memoryUsagePercent.toFixed(1),
          },
        };
        overallStatus = 'unhealthy';
      } else if (memoryUsagePercent > 75) {
        checks.memory = {
          status: 'warn',
          message: `Memory usage high: ${memoryUsagePercent.toFixed(1)}%`,
          details: {
            used: `${Math.round(metrics.memory.used / 1024 / 1024)}MB`,
            total: `${Math.round(metrics.memory.total / 1024 / 1024)}MB`,
            usagePercent: memoryUsagePercent.toFixed(1),
          },
        };
        if (overallStatus === 'healthy') overallStatus = 'degraded';
      } else {
        checks.memory = {
          status: 'pass',
          message: `Memory usage normal: ${memoryUsagePercent.toFixed(1)}%`,
          details: {
            used: `${Math.round(metrics.memory.used / 1024 / 1024)}MB`,
            total: `${Math.round(metrics.memory.total / 1024 / 1024)}MB`,
            usagePercent: memoryUsagePercent.toFixed(1),
          },
        };
      }
    }

    // Disk space check
    if (this.config.checks.diskSpace) {
      try {
        // Get disk usage for the application directory
        const appDir = path.resolve(__dirname, '../../..');
        const stats = fs.statSync(appDir);

        // Note: Node.js doesn't have built-in disk space checking
        // This is a simplified check - in production, use system calls
        checks.diskSpace = {
          status: 'pass',
          message: 'Disk space check passed (simplified)',
          details: {
            appDirectory: appDir,
            note: 'Full disk space monitoring requires system-level calls',
          },
        };
      } catch (error) {
        checks.diskSpace = {
          status: 'warn',
          message: 'Disk space check encountered an error',
          details: { error: error instanceof Error ? error.message : String(error) },
        };
      }
    }

    // Performance check based on metrics
    const healthMetrics = metricsService.getHealthStatus();
    if (healthMetrics.requests.avgResponseTime > this.config.thresholds.maxResponseTime) {
      checks.performance = {
        status: 'fail',
        message: `Average response time too high: ${healthMetrics.requests.avgResponseTime}ms`,
        details: {
          avgResponseTime: healthMetrics.requests.avgResponseTime,
          totalRequests: healthMetrics.requests.total,
        },
      };
      overallStatus = 'unhealthy';
    } else if (healthMetrics.requests.avgResponseTime > 1000) {
      checks.performance = {
        status: 'warn',
        message: `Average response time elevated: ${healthMetrics.requests.avgResponseTime}ms`,
        details: {
          avgResponseTime: healthMetrics.requests.avgResponseTime,
          totalRequests: healthMetrics.requests.total,
        },
      };
      if (overallStatus === 'healthy') overallStatus = 'degraded';
    } else {
      checks.performance = {
        status: 'pass',
        message: `Performance OK: ${healthMetrics.requests.avgResponseTime}ms avg response time`,
        details: {
          avgResponseTime: healthMetrics.requests.avgResponseTime,
          totalRequests: healthMetrics.requests.total,
        },
      };
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0', // Should be read from package.json
      uptime: Math.floor(process.uptime()),
      checks,
    };
  }

  // Simple health check for load balancers
  async simpleHealthCheck(): Promise<{
    status: string;
    timestamp: string;
  }> {
    const detailed = await this.performHealthCheck();
    return {
      status: detailed.status === 'healthy' ? 'ok' : 'error',
      timestamp: detailed.timestamp,
    };
  }

  // Readiness check (for Kubernetes)
  async readinessCheck(): Promise<{
    ready: boolean;
    timestamp: string;
    services: Record<string, boolean>;
  }> {
    const services: Record<string, boolean> = {
      database: true, // Assume ready for MVP
      cache: true,
      external: true,
    };

    return {
      ready: Object.values(services).every(Boolean),
      timestamp: new Date().toISOString(),
      services,
    };
  }
}

// Global health check service instance
export const healthCheckService = new HealthCheckService();

// Express routes for health checks
export const createHealthRoutes = () => {
  const healthCheck = async (req: Request, res: Response) => {
    try {
      const health = await healthCheckService.performHealthCheck();

      const statusCode = health.status === 'healthy' ? 200 :
                        health.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const simpleHealthCheck = async (req: Request, res: Response) => {
    try {
      const health = await healthCheckService.simpleHealthCheck();
      res.status(health.status === 'ok' ? 200 : 503).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const readinessCheck = async (req: Request, res: Response) => {
    try {
      const readiness = await healthCheckService.readinessCheck();
      res.status(readiness.ready ? 200 : 503).json(readiness);
    } catch (error) {
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return {
    healthCheck,
    simpleHealthCheck,
    readinessCheck,
  };
};
