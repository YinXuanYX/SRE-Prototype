import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('api/consent')
export class ConsentController {
  constructor(private readonly db: DatabaseService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async updateConsent(
    @Request() req: any,
    @Body('consentType') consentType: string,
    @Body('status') status: 'Granted' | 'Revoked'
  ) {
    const userId = req.user.sub; // extract from JWT auth payload
    
    console.log(`[Consent] Logging consent update for user ${userId}: ${consentType} = ${status}`);
    
    // Write audit trail log to PostgreSQL
    const results = await this.db.query(
      `INSERT INTO consent_logs (user_id, consent_type, status, timestamp)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [userId, consentType, status]
    );

    return {
      message: 'Consent preference successfully recorded.',
      log: results[0]
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getConsentStatus(
    @Request() req: any,
    @Body('consentType') consentType: string
  ) {
    const userId = req.user.sub;
    const type = consentType || 'appliance_breakdown';

    // Retrieve most recent consent log
    const logs = await this.db.query(
      `SELECT * FROM consent_logs 
       WHERE user_id = $1 AND consent_type = $2 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [userId, type]
    );

    return {
      consentGranted: logs[0] ? logs[0].status === 'Granted' : false,
      log: logs[0] || null
    };
  }
}
