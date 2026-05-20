import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  private isMock = false;

  // In-memory data store for mock fallback
  private mockUsers: any[] = [
    { id: 1, email: 'resident@example.com', display_name: 'John Resident', role: 'Resident', created_at: new Date() },
    { id: 2, email: 'admin@example.com', display_name: 'Sarah Admin', role: 'Admin', created_at: new Date() },
    { id: 3, email: 'superadmin@example.com', display_name: 'David SuperAdmin', role: 'Super Admin', created_at: new Date() },
    { id: 4, email: 'support@example.com', display_name: 'Alex Support', role: 'Support', created_at: new Date() }
  ];
  private mockConsentLogs: any[] = [];
  private mockTelemetry: any[] = [];

  async onModuleInit() {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'sre_db',
      user: process.env.DB_USER || 'sre_admin',
      password: process.env.DB_PASSWORD || 'sre_password_secure_2026',
      connectionTimeoutMillis: 2000, // fast fail for local prototype fallback
    };

    try {
      this.logger.log(`Attempting connection to TimescaleDB at ${config.host}:${config.port}...`);
      this.pool = new Pool(config);
      
      // Test the connection immediately
      await this.pool.query('SELECT 1');
      this.logger.log('Successfully connected to TimescaleDB.');
    } catch (err: any) {
      this.logger.warn(`Database connection failed: ${err.message}. Falling back to dynamic IN-MEMORY mock storage.`);
      this.isMock = true;
      this.pool = null;
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      this.logger.log('Closing database connection pool...');
      await this.pool.end();
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    if (this.isMock) {
      return this.handleMockQuery<T>(text, params || []);
    }

    const start = Date.now();
    try {
      const res = await this.pool!.query(text, params);
      const duration = Date.now() - start;
      this.logger.debug(`Executed query: ${text} | Duration: ${duration}ms`);
      return res.rows;
    } catch (err: any) {
      this.logger.error(`Query Error: ${err.message} | Query: ${text}`);
      throw err;
    }
  }

  private handleMockQuery<T>(text: string, params: any[]): T[] {
    const queryNormalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
    this.logger.debug(`[Mock DB Query] Executing: ${queryNormalized}`);

    // Query 1: Find User by Email
    // SELECT * FROM users WHERE email = $1
    if (queryNormalized.includes('select * from users where email =')) {
      const email = params[0];
      const found = this.mockUsers.find(u => u.email === email);
      return (found ? [found] : []) as T[];
    }

    // Query 2: Insert User
    // INSERT INTO users (email, display_name, role) VALUES ($1, $2, $3) RETURNING *
    if (queryNormalized.includes('insert into users')) {
      const [email, name, role] = params;
      const newUser = {
        id: this.mockUsers.length + 1,
        email,
        display_name: name,
        role: role || 'Resident',
        created_at: new Date()
      };
      this.mockUsers.push(newUser);
      return [newUser] as T[];
    }

    // Query 3: Find User by ID
    // SELECT * FROM users WHERE id = $1
    if (queryNormalized.includes('select * from users where id =')) {
      const id = params[0];
      const found = this.mockUsers.find(u => u.id === id);
      return (found ? [found] : []) as T[];
    }

    // Query 4: Insert Consent Log
    // INSERT INTO consent_logs (user_id, consent_type, status, timestamp) VALUES ($1, $2, $3, NOW()) RETURNING *
    if (queryNormalized.includes('insert into consent_logs')) {
      const [userId, consentType, status] = params;
      const newLog = {
        id: this.mockConsentLogs.length + 1,
        user_id: userId,
        consent_type: consentType,
        status: status || 'Revoked',
        timestamp: new Date()
      };
      this.mockConsentLogs.push(newLog);
      return [newLog] as T[];
    }

    // Query 5: Retrieve Latest Consent Log
    // SELECT * FROM consent_logs WHERE user_id = $1 AND consent_type = $2 ORDER BY timestamp DESC LIMIT 1
    if (queryNormalized.includes('select * from consent_logs')) {
      const [userId, consentType] = params;
      const filtered = this.mockConsentLogs
        .filter(l => l.user_id === userId && l.consent_type === consentType)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return (filtered[0] ? [filtered[0]] : []) as T[];
    }

    // Query 6: Ingest Telemetry
    // INSERT INTO energy_telemetry ...
    if (queryNormalized.includes('insert into energy_telemetry')) {
      const [timestamp, deviceId, deviceName, status, loadKw, voltage] = params;
      const newTelemetry = {
        timestamp: new Date(timestamp),
        device_id: deviceId,
        device_name: deviceName,
        status,
        load_kw: loadKw,
        voltage
      };
      this.mockTelemetry.push(newTelemetry);
      
      // Limit size of mock telemetry array in memory
      if (this.mockTelemetry.length > 500) {
        this.mockTelemetry.shift();
      }
      return [newTelemetry] as T[];
    }

    // Default Fallback
    return [] as T[];
  }

  async getPool(): Promise<Pool | null> {
    return this.pool;
  }
}
