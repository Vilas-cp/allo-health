import { Controller, Post, Get, Put, Param, Body, Delete, UseGuards, Query } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)

@Controller('queue')
export class QueueController {
  constructor(private queueService: QueueService) {}

  @Post()
  async addPatient(@Body() body: { patientName: string; priority?: 'Normal' | 'High' }) {
    return this.queueService.addPatient(body.patientName, body.priority || 'Normal');
  }

  @Get()
  async getQueue() {
    return this.queueService.getQueue();
  }
  
  @Get('search')
async searchPatient(@Query('name') name: string) {
  return this.queueService.searchPatientByName(name);
}


  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.queueService.updateStatus(id, body.status);
  }

  @Delete(':id')
  async deletePatient(@Param('id') id: string) {
    return this.queueService.deletePatient(id);
  }

  @Put(':id/priority')
  async updatePriority(@Param('id') id: string, @Body() body: { priority: 'Normal' | 'High' }) {
    return this.queueService.updatePriority(id, body.priority);
  }
}
