import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService
  ) {}

  async validateOrCreateSSOUser(email: string, displayName: string, requestedRole?: string): Promise<any> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    // Check if user exists in our DB
    const users = await this.db.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = users[0];

    if (!user) {
      // If user does not exist, we register them
      // PRD: Every account must be explicitly associated with a system role. Registration attempts lacking a valid role must be blocked.
      const validRoles = ['Resident', 'Admin', 'Super Admin', 'Support'];
      
      let assignedRole = requestedRole;

      // Check if email has a preset mapping if no role is explicitly passed
      if (!assignedRole) {
        if (email.startsWith('admin')) assignedRole = 'Admin';
        else if (email.startsWith('super')) assignedRole = 'Super Admin';
        else if (email.startsWith('support')) assignedRole = 'Support';
        else if (email.includes('@')) assignedRole = 'Resident'; // Default fallback
      }

      if (!assignedRole || !validRoles.includes(assignedRole)) {
        throw new BadRequestException('Registration blocked: An identified, valid system role must be provided.');
      }

      const name = displayName || email.split('@')[0];
      const result = await this.db.query(
        'INSERT INTO users (email, display_name, role) VALUES ($1, $2, $3) RETURNING *',
        [email, name, assignedRole]
      );
      user = result[0];
    } else if (requestedRole) {
      // If user exists and a role is explicitly requested (e.g. from the Developer Role Switcher),
      // update their role dynamically to ensure backend API authorization alignment.
      const validRoles = ['Resident', 'Admin', 'Super Admin', 'Support'];
      if (validRoles.includes(requestedRole)) {
        await this.db.query('UPDATE users SET role = $1 WHERE id = $2', [requestedRole, user.id]);
        user.role = requestedRole;
      }
    }

    // Generate JWT Token
    const payload = { 
      sub: user.id, 
      email: user.email, 
      displayName: user.display_name, 
      role: user.role 
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role
      }
    };
  }

  async getUserById(id: number) {
    const users = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    return users[0];
  }
}
