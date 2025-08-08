import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { Doctor } from './doctor.entity';

@Controller('doctors')
export class DoctorController {
  constructor(private doctorService: DoctorService) {}

  @Post()
  create(@Body() body: Partial<Doctor>) {
    return this.doctorService.create(body);
  }

  @Get()
  findAll() {
    return this.doctorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Doctor>) {
    return this.doctorService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.doctorService.delete(id);
  }
}
