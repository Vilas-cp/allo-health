import { Controller, Post, Get, Put, Body, Param } from '@nestjs/common';
import { AppointmentService } from './appointment.service';

@Controller('appointments')
export class AppointmentController {
  constructor(private service: AppointmentService) {}

  @Post()
  async book(@Body() body: { patientName: string; doctorId: string; timeSlot: string }) {
    return this.service.bookAppointment(body);
  }

  @Get()
  async getAll() {
    return this.service.getAllAppointments();
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateStatus(id, body.status);
  }

  @Put(':id/reschedule')
  async reschedule(@Param('id') id: string, @Body() body: { timeSlot: string }) {
    return this.service.reschedule(id, body.timeSlot);
  }

  @Put(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
