import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueueEntry } from './queue.entity';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueEntry)
    private queueRepo: Repository<QueueEntry>,
  ) {}

  // Add patient with arrival time and then reorder
  async addPatient(patientName: string, priority: 'Normal' | 'High' = 'Normal') {
    const entry = this.queueRepo.create({
      patientName,
      priority,
      status: 'Waiting',
      arrivalTime: new Date(),
      queueNumber: 0, // will be set in reorder
    });
    await this.queueRepo.save(entry);
    await this.reorderQueue();
    return entry;
  }

  // Get queue ordered by queueNumber
  async getQueue() {
    return this.queueRepo.find({ order: { queueNumber: 'ASC' } });
  }

  // Update status
  async updateStatus(id: string, status: string) {
    const res = await this.queueRepo.update(id, { status });
    return res;
  }

  // Delete a patient and re-number queue
  async deletePatient(id: string) {
    const entry = await this.queueRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Queue entry not found');
    await this.queueRepo.remove(entry);
    await this.reorderQueue();
    return { success: true };
  }

  
  async updatePriority(id: string, priority: 'Normal' | 'High') {
    const entry = await this.queueRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Queue entry not found');
    entry.priority = priority;
    await this.queueRepo.save(entry);
    await this.reorderQueue();
    return entry;
  }

  // Recompute queueNumber based on priority (High first) then arrivalTime
  private async reorderQueue() {
    const list = await this.queueRepo.find({
      where: { status: 'Waiting' },
      order: {
        priority: 'DESC', // High before Normal
        createdAt: 'ASC', // earliest arrivals earlier within same priority
      },
    });

    let i = 1;
    for (const item of list) {
      // Only update if changed to minimize writes
      if (item.queueNumber !== i) {
        item.queueNumber = i;
        await this.queueRepo.save(item);
      }
      i++;
    }

    // For entries not 'Waiting' (like With Doctor, Completed) we can leave their queueNumber as-is or set to 0.
    // Optionally reset others:
    const others = await this.queueRepo.find({
      where: [{ status: 'With Doctor' }, { status: 'Completed' }],
    });
    for (const o of others) {
      if (o.queueNumber !== 0) {
        o.queueNumber = 0;
        await this.queueRepo.save(o);
      }
    }
  }
}
