import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,Between } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Appointment } from '../appointment/appointment.entity';
import dayjs from 'dayjs';
import { DoctorWithStatus } from './doctor-with-status.dto';

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

 async delete(id: string) {

  await this.appointmentRepo.delete({ doctor: { id } });
  return this.doctorRepo.delete(id);
}


  
  async findAllWithStatus(): Promise<DoctorWithStatus[]> {
  const doctors = await this.doctorRepo.find();
  const now = dayjs();

  const APPOINTMENT_DURATION_MINUTES = 30;
  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const result: DoctorWithStatus[] = [];

  for (const doc of doctors) {
    const today = now.format('dddd');

    let status = '';
    let nextAvailable = '';

    if (!doc.availability.includes(today)) {
      // Doctor does not work today — find next available day
      let minDiff = Infinity;
      let targetDay = '';

      for (const day of doc.availability) {
        const diff =
          (daysOfWeek.indexOf(day) - daysOfWeek.indexOf(today) + 7) % 7;
        if (diff > 0 && diff < minDiff) {
          minDiff = diff;
          targetDay = day;
        }
      }

      nextAvailable = `Next ${targetDay} at 09:00 AM`;
      status = 'Not Available';

    } else {
      // Doctor works today — check appointments for today
      const todayStart = now.startOf('day').toDate();
      const todayEnd = now.endOf('day').toDate();

      const todaysAppointments = await this.appointmentRepo.find({
        where: {
          doctor: { id: doc.id },
          status: 'Booked',
          timeSlot: Between(todayStart, todayEnd),
        },
        order: { timeSlot: 'ASC' },
      });

      const nowMs = now.toDate().getTime();

      status = 'Available';
      nextAvailable = 'Available now';

      for (const appt of todaysAppointments) {
        const apptStart = new Date(appt.timeSlot).getTime();
        const apptEnd = apptStart + APPOINTMENT_DURATION_MINUTES * 60 * 1000;

        if (nowMs >= apptStart && nowMs < apptEnd) {
          // Doctor is busy right now
          status = 'Busy';
          const freeInMinutes = Math.ceil((apptEnd - nowMs) / (60 * 1000));
          nextAvailable = `Free in ${freeInMinutes} minutes`;
          break;
        } else if (nowMs < apptStart) {
          // Doctor free now, but has upcoming appointment
          const freeForMinutes = Math.ceil((apptStart - nowMs) / (60 * 1000));
          nextAvailable = `Free for next ${freeForMinutes} minutes`;
          break;
        }
        // else: nowMs > apptEnd, check next appointment
      }
      // If no appointments or current time after last appointment, status stays Available, nextAvailable "Available now"
    }

    result.push({ ...doc, status, nextAvailable });
  }

  return result;
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
