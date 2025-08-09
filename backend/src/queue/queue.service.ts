import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { QueueEntry } from './queue.entity';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueEntry)
    private queueRepo: Repository<QueueEntry>,
  ) {}

  // Add patient with arrival time and then reorder
  async addPatient(patientName: string, priority: 'Normal' | 'High' = 'Normal') {
    // Get max queueNumber currently - fixed findOne usage
    const entries = await this.queueRepo.find({
      order: { queueNumber: 'DESC' },
      take: 1,
    });
    const maxQueueNumberEntry = entries[0];
    const maxQueueNumber = maxQueueNumberEntry ? maxQueueNumberEntry.queueNumber : 0;

    const entry = this.queueRepo.create({
      patientName,
      priority,
      status: 'Waiting',
      arrivalTime: new Date(),
      queueNumber: maxQueueNumber + 1, // assign next sequential number
    });

    await this.queueRepo.save(entry);
    // No reorder here on add (to keep queue order stable)
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
    await this.reorderQueue(); // reorder after delete to fix gaps
    return { success: true };
  }

  async searchPatientByName(name: string) {
    return this.queueRepo.find({
      where: {
        patientName: ILike(`%${name}%`), // case-insensitive partial match
      },
      order: { queueNumber: 'ASC' },
    });
  }

  async updatePriority(id: string, priority: 'Normal' | 'High') {
    const entry = await this.queueRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Queue entry not found');
    entry.priority = priority;
    await this.queueRepo.save(entry);
    // Don't reorder queueNumber on priority change, keep queueNumber fixed
    return entry;
  }

  // Recompute queueNumber after deletion only
  private async reorderQueue() {
    // Get all waiting patients ordered by their current queueNumber ascending
    const list = await this.queueRepo.find({
      where: { status: 'Waiting' },
      order: { queueNumber: 'ASC' },
    });

    let i = 1;
    for (const item of list) {
      if (item.queueNumber !== i) {
        item.queueNumber = i;
        await this.queueRepo.save(item);
      }
      i++;
    }

    // Reset queueNumber for non-waiting statuses
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
