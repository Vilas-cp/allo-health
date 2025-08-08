import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { Repository, Not } from 'typeorm';
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

    // Find existing non-cancelled appointments for doctor
    const existing = await this.appointmentRepo.find({
      where: { doctor: { id: data.doctorId }, status: Not('Cancelled') } as any,
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

  async updateStatus(id: string, status: string) {
    return this.appointmentRepo.update(id, { status });
  }

  async cancel(id: string) {
    return this.updateStatus(id, 'Cancelled');
  }

  async reschedule(id: string, newTime: string) {
    return this.appointmentRepo.update(id, { timeSlot: newTime });
  }
}
