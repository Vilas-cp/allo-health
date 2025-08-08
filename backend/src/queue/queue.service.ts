import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueueEntry } from './queue.entity';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueEntry)
    private queueRepo: Repository<QueueEntry>,
  ) {}

  async addPatient(
    patientName: string,
    priority: 'Normal' | 'High' = 'Normal',
  ) {
    const count = await this.queueRepo.count();

    const entry = this.queueRepo.create({
      patientName,
      priority,
      queueNumber: count + 1,
      status: 'Waiting',
    });

    return this.queueRepo.save(entry);
  }

  async getQueue() {
    return this.queueRepo.find({
      order: {
        priority: 'DESC',
        queueNumber: 'ASC',
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.queueRepo.update(id, { status });
  }
}
