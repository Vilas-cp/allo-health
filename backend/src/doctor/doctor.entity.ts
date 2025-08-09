import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Appointment } from '../appointment/appointment.entity';

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  specialization: string;

  @Column()
  gender: string;

  @Column()
  location: string;

  // Days available
  @Column("simple-array")
  availability: string[];


  @Column('jsonb', { nullable: true })
  workingHours: Record<string, string>; 

  @OneToMany(() => Appointment, (appt) => appt.doctor)
  appointments: Appointment[];
}
