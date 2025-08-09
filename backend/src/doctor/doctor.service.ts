import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Appointment } from '../appointment/appointment.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) {}

  create(doctorData: Partial<Doctor>) {
    const doctor = this.doctorRepo.create(doctorData);
    return this.doctorRepo.save(doctor);
  }

  findAll() {
    return this.doctorRepo.find();
  }

  findOne(id: string) {
    return this.doctorRepo.findOne({ where: { id } });
  }

  update(id: string, doctorData: Partial<Doctor>) {
    return this.doctorRepo.update(id, doctorData);
  }

  delete(id: string) {
    return this.doctorRepo.delete(id);
  }
  
  async getSchedule(id: string) {
    const doctor = await this.doctorRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const now = new Date();
    const upcoming = await this.appointmentRepo.find({
      where: { doctor: { id }, status: 'Booked' } as any,
      order: { timeSlot: 'ASC' },
    });

    const BUFFER_MS = 30 * 60 * 1000;
    let isFreeNow = true;
    let timeUntilFreeMinutes = 0;

    const nextAppointments: {
      id: string;
      patientName: string;
      timeSlot: Date;
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
