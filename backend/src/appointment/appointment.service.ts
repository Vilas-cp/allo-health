import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { Repository } from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  async bookAppointment(data: {
    patientName: string;
    doctorId: string;
    timeSlot: string;
  }) {
    const doctor = await this.doctorRepo.findOne({ where: { id: data.doctorId } });
    if (!doctor) throw new Error('Doctor not found');

    const appointment = this.appointmentRepo.create({
      patientName: data.patientName,
      doctor,
      timeSlot: data.timeSlot,
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
