import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  create(doctorData: Partial<Doctor>) {
    const doctor = this.doctorRepo.create(doctorData);
    return this.doctorRepo.save(doctor);
  }

  findAll() {
    return this.doctorRepo.find();
  }

  findOne(id: string) {
    return this.doctorRepo.findOne({ where: { id } });
  }

  update(id: string, doctorData: Partial<Doctor>) {
    return this.doctorRepo.update(id, doctorData);
  }

  delete(id: string) {
    return this.doctorRepo.delete(id);
  }
}
