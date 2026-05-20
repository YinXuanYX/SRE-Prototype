import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

interface ZoneMapping {
  id: string;
  name: string;
  floor: string;
  type: 'Residential' | 'Common Area' | 'Utility';
  devices: string[];
  tenant: string;
}

@Controller('api/zones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZonesController {
  // In-memory zone store (would be a database table in production)
  private zones: ZoneMapping[] = [
    {
      id: 'zone-a1',
      name: 'Unit A-201',
      floor: 'Level 2',
      type: 'Residential',
      devices: ['device-aircon-01', 'device-fridge-01'],
      tenant: 'John Resident'
    },
    {
      id: 'zone-b1',
      name: 'Corridor B',
      floor: 'Level 3',
      type: 'Common Area',
      devices: ['device-pump-01'],
      tenant: 'Building Management'
    },
    {
      id: 'zone-lobby',
      name: 'Ground Lobby',
      floor: 'Ground',
      type: 'Common Area',
      devices: ['device-light-01', 'device-anomaly-timer'],
      tenant: 'Building Management'
    }
  ];

  @Get()
  @Roles('Admin', 'Super Admin')
  getZones() {
    return this.zones;
  }

  @Post()
  @Roles('Admin', 'Super Admin')
  createZone(@Body() body: { name: string; floor: string; type: string; devices: string[]; tenant: string }) {
    const newZone: ZoneMapping = {
      id: `zone-${Date.now()}`,
      name: body.name,
      floor: body.floor,
      type: body.type as ZoneMapping['type'],
      devices: body.devices || [],
      tenant: body.tenant || 'Unassigned'
    };
    this.zones.push(newZone);
    return { status: 'Created', zone: newZone };
  }

  @Put(':id')
  @Roles('Admin', 'Super Admin')
  updateZone(@Param('id') id: string, @Body() body: Partial<ZoneMapping>) {
    const idx = this.zones.findIndex(z => z.id === id);
    if (idx === -1) {
      return { status: 'Error', message: `Zone ${id} not found.` };
    }
    this.zones[idx] = { ...this.zones[idx], ...body };
    return { status: 'Updated', zone: this.zones[idx] };
  }

  @Delete(':id')
  @Roles('Admin', 'Super Admin')
  deleteZone(@Param('id') id: string) {
    const idx = this.zones.findIndex(z => z.id === id);
    if (idx === -1) {
      return { status: 'Error', message: `Zone ${id} not found.` };
    }
    const removed = this.zones.splice(idx, 1);
    return { status: 'Deleted', zone: removed[0] };
  }
}
