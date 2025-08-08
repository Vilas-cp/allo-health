import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class QueueEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientName: string;

  @Column()
  queueNumber: number;

  @Column()
  status: string; // "Waiting", "With Doctor", "Completed"

  @Column({ default: 'Normal' })
  priority: string; // "Normal" or "High"

  @CreateDateColumn()
  createdAt: Date;
}
