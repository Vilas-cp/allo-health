import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { Repository, Between, ILike } from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  private BUFFER_MS = 30 * 60 * 1000;

  /**
   * Normalizes incoming timeSlot to UTC before storage.
   */
  private normalizeToUTC(timeSlot: string) {
    const parsed = dayjs(timeSlot);
    if (!parsed.isValid()) throw new BadRequestException('Invalid timeSlot');
    return parsed.utc();
  }

  async bookAppointment(data: {
    patientName: string;
    doctorId: string;
    timeSlot: string; // ISO string (local or with offset)
  }) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: data.doctorId },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const requestedUTC = this.normalizeToUTC(data.timeSlot);
    const nowUTC = dayjs.utc();
    if (requestedUTC.isBefore(nowUTC)) {
      throw new BadRequestException('Cannot book an appointment in the past.');
    }

    // Check if doctor is available on requested local day
    const requestedLocal = requestedUTC.local();
    const dayName = requestedLocal.format('dddd');
    if (!doctor.availability.includes(dayName)) {
      throw new BadRequestException(`Doctor is not available on ${dayName}`);
    }

    // Check working hours for that day
    const hours = doctor.workingHours?.[dayName];
    if (!hours) {
      throw new BadRequestException(`Doctor has no working hours set for ${dayName}`);
    }

    const [startTime, endTime] = hours.split('-').map(s => s.trim()); // e.g. ["09:00", "17:00"]
    const startLocal = requestedLocal.set('hour', parseInt(startTime.split(':')[0]))
                                     .set('minute', parseInt(startTime.split(':')[1]));
    const endLocal = requestedLocal.set('hour', parseInt(endTime.split(':')[0]))
                                   .set('minute', parseInt(endTime.split(':')[1]));

    if (requestedLocal.isBefore(startLocal) || !requestedLocal.isBefore(endLocal)) {
      throw new BadRequestException(
        `Appointment time must be within working hours: ${hours}`
      );
    }

    // Check for conflicting appointments in UTC
    const startBuffer = requestedUTC.subtract(this.BUFFER_MS, 'millisecond').toDate();
    const endBuffer = requestedUTC.add(this.BUFFER_MS, 'millisecond').toDate();

    const clash = await this.appointmentRepo.findOne({
      where: {
        doctor: { id: data.doctorId },
        status: 'Booked',
        timeSlot: Between(startBuffer, endBuffer),
      },
    });
    if (clash) {
      throw new BadRequestException('Doctor not available at this time (conflicts with another appointment).');
    }

    const appointment = this.appointmentRepo.create({
      patientName: data.patientName,
      doctor,
      timeSlot: requestedUTC.toISOString(), // store in UTC
      status: 'Booked',
    });

    return this.appointmentRepo.save(appointment);
  }

  async getAllAppointments() {
    return this.appointmentRepo.find({ order: { createdAt: 'DESC' } });
  }

  async checkAvailability(doctorId: string, timeSlot: string) {
    const requestedUTC = this.normalizeToUTC(timeSlot);
    const start = requestedUTC.subtract(this.BUFFER_MS, 'millisecond').toDate();
    const end = requestedUTC.add(this.BUFFER_MS, 'millisecond').toDate();

    const clash = await this.appointmentRepo.findOne({
      where: {
        doctor: { id: doctorId },
        timeSlot: Between(start, end),
        status: 'Booked',
      },
    });

    if (clash) {
      throw new BadRequestException('Time slot clashes with another appointment');
    }

    return { available: true };
  }

  async updateStatus(id: string, status: string) {
    const appt = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['doctor'],
    });
    if (!appt) throw new NotFoundException('Appointment not found');

    if (status === 'Booked') {
      const start = dayjs.utc(appt.timeSlot).subtract(this.BUFFER_MS, 'millisecond').toDate();
      const end = dayjs.utc(appt.timeSlot).add(this.BUFFER_MS, 'millisecond').toDate();

      const conflicting = await this.appointmentRepo.findOne({
        where: {
          doctor: { id: appt.doctor.id },
          status: 'Booked',
          timeSlot: Between(start, end),
        },
      });

      if (conflicting) {
        throw new BadRequestException('Doctor is already booked around this time (±30 min).');
      }

      if (dayjs.utc(appt.timeSlot).isBefore(dayjs.utc())) {
        throw new BadRequestException('Cannot revert to booked for a past time.');
      }
    }

    appt.status = status;
    return await this.appointmentRepo.save(appt);
  }

  async cancel(id: string) {
    return this.updateStatus(id, 'Cancelled');
  }

  async reschedule(id: string, newTime: string) {
    const appt = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['doctor'],
    });
    if (!appt) throw new NotFoundException('Appointment not found');

    const requestedUTC = this.normalizeToUTC(newTime);
    const nowUTC = dayjs.utc();
    if (requestedUTC.isBefore(nowUTC)) {
      throw new BadRequestException('Cannot select a past time');
    }

    const requestedLocal = requestedUTC.local();
    const doctor = appt.doctor;

    const dayName = requestedLocal.format('dddd');
    if (!doctor.availability.includes(dayName)) {
      throw new BadRequestException(`Doctor is not available on ${dayName}`);
    }

    const hours = doctor.workingHours?.[dayName];
    if (!hours) {
      throw new BadRequestException(`Doctor has no working hours set for ${dayName}`);
    }

    const [startTime, endTime] = hours.split('-').map(s => s.trim());
    const startLocal = requestedLocal.set('hour', parseInt(startTime.split(':')[0]))
                                     .set('minute', parseInt(startTime.split(':')[1]));
    const endLocal = requestedLocal.set('hour', parseInt(endTime.split(':')[0]))
                                   .set('minute', parseInt(endTime.split(':')[1]));

    if (requestedLocal.isBefore(startLocal) || !requestedLocal.isBefore(endLocal)) {
      throw new BadRequestException(
        `Appointment time must be within working hours: ${hours}`
      );
    }

    const startBuffer = requestedUTC.subtract(this.BUFFER_MS, 'millisecond').toDate();
    const endBuffer = requestedUTC.add(this.BUFFER_MS, 'millisecond').toDate();

    const clash = await this.appointmentRepo.findOne({
      where: {
        doctor: { id: doctor.id },
        status: 'Booked',
        timeSlot: Between(startBuffer, endBuffer),
      },
    });
    if (clash && clash.id !== id) {
      throw new BadRequestException('Doctor not available at this time (conflicts with another appointment).');
    }

    return this.appointmentRepo.update(id, {
      timeSlot: requestedUTC.toISOString(),
    });
  }

  async searchAppointmentsByPatientName(name: string) {
    return this.appointmentRepo.find({
      where: { patientName: ILike(`%${name}%`) },
      order: { timeSlot: 'ASC' },
      relations: ['doctor'],
    });
  }
}
