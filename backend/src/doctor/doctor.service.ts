import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Appointment } from '../appointment/appointment.entity';
import dayjs from 'dayjs';
import { DoctorWithStatus } from './doctor-with-status.dto';

@Injectable()
export class DoctorService {
  private readonly APPOINTMENT_DURATION_MINUTES = 30;
  private readonly DAYS_OF_WEEK = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  async create(doctorData: Partial<Doctor>): Promise<Doctor> {
    const doctor = this.doctorRepo.create(doctorData);
    return await this.doctorRepo.save(doctor);
  }

  async findAll(): Promise<Doctor[]> {
    return await this.doctorRepo.find();
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException(`Doctor with ID ${id} not found`);
    return doctor;
  }

  async update(id: string, doctorData: Partial<Doctor>): Promise<void> {
    const result = await this.doctorRepo.update(id, doctorData);
    if (result.affected === 0) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
  }

  async delete(id: string): Promise<void> {
    await this.appointmentRepo.delete({ doctor: { id } });
    const result = await this.doctorRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
  }

  async findAllWithStatus(): Promise<DoctorWithStatus[]> {
    const doctors = await this.doctorRepo.find();
    const now = dayjs();

    const result: DoctorWithStatus[] = [];

    for (const doc of doctors) {
      const today = now.format('dddd');
      let status = 'Available';
      let nextAvailable = 'Available now';

      if (!doc.availability.includes(today)) {
        // Find the next available day
        let minDiff = Infinity;
        let targetDay = '';

        for (const day of doc.availability) {
          const diff =
            (this.DAYS_OF_WEEK.indexOf(day) - this.DAYS_OF_WEEK.indexOf(today) + 7) % 7;
          if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            targetDay = day;
          }
        }

        if (targetDay) {
          nextAvailable = `Next ${targetDay} at 09:00 AM`;
        }
        status = 'Not Available';
      } else {
        // Doctor works today — check today's appointments
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

        const nowMs = now.valueOf();

        for (const appt of todaysAppointments) {
          const apptStart = new Date(appt.timeSlot).getTime();
          const apptEnd = apptStart + this.APPOINTMENT_DURATION_MINUTES * 60 * 1000;

          if (nowMs >= apptStart && nowMs < apptEnd) {
            status = 'Busy';
            const freeInMinutes = Math.ceil((apptEnd - nowMs) / (60 * 1000));
            nextAvailable = `Free in ${freeInMinutes} minutes`;
            break;
          } else if (nowMs < apptStart) {
            const freeForMinutes = Math.ceil((apptStart - nowMs) / (60 * 1000));
            nextAvailable = `Free for next ${freeForMinutes} minutes`;
            break;
          }
        }
      }

      result.push({ ...doc, status, nextAvailable });
    }

    return result;
  }

 async getSchedule(id: string) {
  const doctor = await this.doctorRepo.findOne({ where: { id } });
  if (!doctor) throw new NotFoundException('Doctor not found');

  const now = new Date();
  
  // Only get FUTURE appointments
  const upcoming = await this.appointmentRepo.find({
    where: { 
      doctor: { id }, 
      status: 'Booked',
      timeSlot: MoreThanOrEqual(now)
    },
    order: { timeSlot: 'ASC' }
  });

  const BUFFER_MS = this.APPOINTMENT_DURATION_MINUTES * 60 * 1000;
  let isFreeNow = true;
  let timeUntilFreeMinutes = 0;

  // Check immediate availability
  if (upcoming.length > 0) {
    const firstApptStart = new Date(upcoming[0].timeSlot).getTime();
    const firstApptEnd = firstApptStart + BUFFER_MS;

    if (now.getTime() < firstApptStart) {
      timeUntilFreeMinutes = Math.ceil((firstApptStart - now.getTime()) / (60 * 1000));
    } else if (now.getTime() < firstApptEnd) {
      isFreeNow = false;
      timeUntilFreeMinutes = Math.ceil((firstApptEnd - now.getTime()) / (60 * 1000));
    }
  }

  return {
    doctor,
    isFreeNow,
    timeUntilFreeMinutes,
    upcoming: upcoming.map(appt => ({
      id: appt.id,
      patientName: appt.patientName,
      timeSlot: appt.timeSlot,
      status: appt.status
    }))
  };
}
}
