import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { Doctor } from './doctor.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
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
    return this.doctorService.findAllWithStatus();
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
  getSchedule(@Param('id') id: string) {
    return this.doctorService.getSchedule(id);
  }
}
