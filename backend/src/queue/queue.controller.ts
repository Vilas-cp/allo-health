import { Controller, Post, Get, Put, Param, Body, Delete } from '@nestjs/common';
import { QueueService } from './queue.service';

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
