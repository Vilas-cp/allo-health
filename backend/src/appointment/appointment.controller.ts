import { Controller, Post, Get, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentController {
  constructor(private service: AppointmentService) {}
  
  @Post()
  async book(
    @Body() body: { patientName: string; doctorId: string; timeSlot: string },
  ) {
    return this.service.bookAppointment(body);
  }

  @Get()
  async getAll() {
    return this.service.getAllAppointments();
  }
  @Post('check')
  async checkAvailability(@Body() body: { doctorId: string; timeSlot: string }) {
    return this.service.checkAvailability(body.doctorId, body.timeSlot);
  }
   @Get('search')
  async searchAppointments(@Query('name') name: string) {
    return this.service.searchAppointmentsByPatientName(name);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.service.updateStatus(id, status);
  }

  @Put(':id/reschedule')
  async reschedule(
    @Param('id') id: string,
    @Body() body: { timeSlot: string },
  ) {
    return this.service.reschedule(id, body.timeSlot);
  }

  @Put(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
