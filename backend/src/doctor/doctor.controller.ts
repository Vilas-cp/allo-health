import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { Doctor } from './doctor.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointment/appointment.entity';

@Controller('doctors')
export class DoctorController {
  constructor(
    private doctorService: DoctorService,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) {}

  @Post()
  create(@Body() body: Partial<Doctor>) {
    return this.doctorService.create(body);
  }

  @Get()
  findAll() {
    return this.doctorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Doctor>) {
    return this.doctorService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.doctorService.delete(id);
  }

 @Get(':id/schedule')
async getSchedule(@Param('id') id: string) {
  const doctor = await this.doctorService.findOne(id);
  if (!doctor) return { error: 'Doctor not found' };

  // upcoming booked appointments (exclude cancelled), ordered ascending
  const now = new Date();
  const upcoming = await this.appointmentRepo.find({
    where: { doctor: { id }, status: 'Booked' } as any,
    order: { timeSlot: 'ASC' },
  });

  const BUFFER_MS = 30 * 60 * 1000;
  let isFreeNow = true;
  let timeUntilFreeMinutes = 0;

  // ✅ Define the array type explicitly
  const nextAppointments: { 
    id: string; 
    patientName: string; 
    timeSlot: string; 
    status: string;
  }[] = [];

  for (const appt of upcoming) {
    const apptStart = new Date(appt.timeSlot).getTime();
    const apptEnd = apptStart + BUFFER_MS;
    if (now.getTime() >= apptStart && now.getTime() <= apptEnd) {
      isFreeNow = false;
      timeUntilFreeMinutes = Math.ceil(
        (apptEnd - now.getTime()) / (60 * 1000),
      );
    }
    nextAppointments.push({
      id: appt.id,
      patientName: appt.patientName,
      timeSlot: appt.timeSlot,
      status: appt.status,
    });
  }

  if (isFreeNow && upcoming.length > 0) {
    const nextStart = new Date(upcoming[0].timeSlot).getTime();
    if (nextStart > now.getTime()) {
      timeUntilFreeMinutes = Math.ceil(
        (nextStart - now.getTime()) / (60 * 1000),
      );
    }
  }

  return {
    doctor,
    isFreeNow,
    timeUntilFreeMinutes,
    upcoming: nextAppointments,
  };
}

}
