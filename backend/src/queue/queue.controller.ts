import { Controller, Post, Get, Put, Param, Body } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  constructor(private queueService: QueueService) {}

  @Post()
  async addPatient(
    @Body() body: { patientName: string; priority?: 'High' | 'Normal' },
  ) {
    return this.queueService.addPatient(
      body.patientName,
      body.priority || 'Normal',
    );
  }

  @Get()
  async getQueue() {
    return this.queueService.getQueue();
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.queueService.updateStatus(id, body.status);
  }
}
