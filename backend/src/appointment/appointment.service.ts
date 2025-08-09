import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { Repository, Not, Between, ILike } from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';
import dayjs from 'dayjs';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}
  private BUFFER_MS = 30 * 60 * 1000;

  async bookAppointment(data: {
  patientName: string;
  doctorId: string;
  timeSlot: string; // ISO string
}) {
  const doctor = await this.doctorRepo.findOne({
    where: { id: data.doctorId },
  });
  if (!doctor) throw new NotFoundException('Doctor not found');

  const requested = dayjs(data.timeSlot);
  if (!requested.isValid())
    throw new BadRequestException('Invalid timeSlot');

  const now = dayjs();
  if (requested.isBefore(now)) {
    throw new BadRequestException('Cannot book an appointment in the past.');
  }

  // Check if doctor is available on requested day
  const dayName = requested.format('dddd');
  if (!doctor.availability.includes(dayName)) {
    throw new BadRequestException(`Doctor is not available on ${dayName}`);
  }

  // Check working hours for that day
  const hours = doctor.workingHours?.[dayName];
  if (!hours) {
    throw new BadRequestException(`Doctor has no working hours set for ${dayName}`);
  }

  const [startTime, endTime] = hours.split('-'); // e.g. ["09:00", "17:00"]
  const appointmentTime = requested.format('HH:mm');

  if (
    appointmentTime < startTime ||
    appointmentTime >= endTime
  ) {
    throw new BadRequestException(
      `Appointment time must be within working hours: ${hours}`
    );
  }

  // Check for conflicting appointments (±30 minutes)
  const BUFFER_MS = 30 * 60 * 1000;
  const existing = await this.appointmentRepo.find({
    where: { doctor: { id: data.doctorId }, status: 'Booked' },
  });

  for (const appt of existing) {
    const existingTime = dayjs(appt.timeSlot);
    const diff = Math.abs(existingTime.diff(requested));
    if (diff < BUFFER_MS) {
      throw new BadRequestException(
        'Doctor not available at this time (conflicts with another appointment).',
      );
    }
  }

  const appointment = this.appointmentRepo.create({
    patientName: data.patientName,
    doctor,
    timeSlot: requested.toISOString(),
    status: 'Booked',
  });

  return this.appointmentRepo.save(appointment);
}

  async getAllAppointments() {
    return this.appointmentRepo.find({ order: { createdAt: 'DESC' } });
  }
async checkAvailability(doctorId: string, timeSlot: string) {
    const start = new Date(new Date(timeSlot).getTime() - 30 * 60000);
    const end = new Date(new Date(timeSlot).getTime() + 30 * 60000);

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

  if (!appt) {
    throw new NotFoundException('Appointment not found');
  }

  // If changing to "Booked", run the same availability check
  if (status === 'Booked') {
    const conflicting = await this.appointmentRepo.findOne({
      where: {
        doctor: { id: appt.doctor.id },
        status: 'Booked',
        timeSlot: Between(
          new Date(new Date(appt.timeSlot).getTime() - 30 * 60000),
          new Date(new Date(appt.timeSlot).getTime() + 30 * 60000),
        ),
      },
    });

    if (conflicting) {
      throw new BadRequestException(
        'Doctor is already booked around this time (±30 min).'
      );
    }

    // Also make sure it's not in the past
    if (new Date(appt.timeSlot).getTime() < Date.now()) {
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

  const requested = dayjs(newTime);
  const now = dayjs();

  if (!requested.isValid()) {
    throw new BadRequestException('Invalid newTime');
  }

  if (requested.isBefore(now)) {
    throw new BadRequestException('Cannot select a past time');
  }

  const doctor = appt.doctor;

  // Check if doctor is available on requested day
  const dayName = requested.format('dddd');
  if (!doctor.availability.includes(dayName)) {
    throw new BadRequestException(`Doctor is not available on ${dayName}`);
  }

  // Check working hours for that day
  const hours = doctor.workingHours?.[dayName];
  if (!hours) {
    throw new BadRequestException(
      `Doctor has no working hours set for ${dayName}`
    );
  }

  const [startTime, endTime] = hours.split('-'); // e.g. ["09:00", "17:00"]
  const appointmentTime = requested.format('HH:mm');

  if (appointmentTime < startTime || appointmentTime >= endTime) {
    throw new BadRequestException(
      `Appointment time must be within working hours: ${hours}`
    );
  }

  // Check for conflicting appointments (±30 minutes)
  const existing = await this.appointmentRepo.find({
    where: {
      doctor: { id: doctor.id },
      status: 'Booked',
    },
  });

  for (const other of existing) {
    if (other.id === id) continue; // skip self
    const otherTime = dayjs(other.timeSlot);
    const diff = Math.abs(otherTime.diff(requested));
    if (diff < this.BUFFER_MS) {
      throw new BadRequestException(
        'Doctor not available at this time (conflicts with another appointment).'
      );
    }
  }

  return this.appointmentRepo.update(id, {
    timeSlot: requested.toISOString(),
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
