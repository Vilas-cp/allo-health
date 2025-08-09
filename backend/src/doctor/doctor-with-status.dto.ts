import { Doctor } from './doctor.entity';

export interface DoctorWithStatus extends Doctor {
  status: string;
  nextAvailable: string;
}
