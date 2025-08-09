import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientName: string;

  @ManyToOne(() => Doctor, { eager: true })
  doctor: Doctor;

  @Column({ type: 'timestamp' })
  timeSlot: Date;

  @Column()
  status: string; // "Booked", "Completed", "Cancelled"

  @CreateDateColumn()
  createdAt: Date;
}
