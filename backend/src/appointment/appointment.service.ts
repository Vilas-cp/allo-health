import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { Repository, Not, Between } from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';

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
    timeSlot: string; // ISO string or datetime-local sent from frontend
  }) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: data.doctorId },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const requested = new Date(data.timeSlot);
    if (isNaN(requested.getTime()))
      throw new BadRequestException('Invalid timeSlot');

    const now = new Date();
    if (requested.getTime() < now.getTime()) {
      throw new BadRequestException('Cannot book an appointment in the past.');
    }

    const existing = await this.appointmentRepo.find({
      where: { doctor: { id: data.doctorId }, status: 'Booked' },
    });

    for (const appt of existing) {
      const existingTime = new Date(appt.timeSlot).getTime();
      const diff = Math.abs(existingTime - requested.getTime());
      if (diff < this.BUFFER_MS) {
        // conflict
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

    const requested = new Date(newTime);
    const now = new Date();

    // Prevent selecting a past date/time
    if (requested.getTime() < now.getTime()) {
      throw new BadRequestException('Cannot select a past time');
    }

    // Check for conflicts with other appointments of the same doctor
    const existing = await this.appointmentRepo.find({
      where: {
        doctor: { id: appt.doctor.id },
        status: ('Booked'),
      },
    });

    for (const other of existing) {
      if (other.id === id) continue; // skip self
      const otherTime = new Date(other.timeSlot).getTime();
      const diff = Math.abs(otherTime - requested.getTime());
      if (diff < this.BUFFER_MS) {
        throw new BadRequestException(
          'Doctor not available at this time (conflicts with another appointment).',
        );
      }
    }

    return this.appointmentRepo.update(id, {
      timeSlot: requested.toISOString(),
    });
  }
}
