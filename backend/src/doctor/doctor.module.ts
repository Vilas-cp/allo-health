import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { Appointment } from 'src/appointment/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor,Appointment])],
  providers: [DoctorService],
  controllers: [DoctorController],
})
export class DoctorModule {}
