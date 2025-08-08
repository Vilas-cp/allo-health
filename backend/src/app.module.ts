import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DoctorModule } from './doctor/doctor.module';
import { QueueModule } from './queue/queue.module';
import { AppointmentModule } from './appointment/appointment.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'db.bhfthummtpkuttfzqhtw.supabase.co',
      port: 5432,
      username: 'postgres',
      password: 'ck8nExTZ7idPIdWE',
      database: 'postgres',
      autoLoadEntities: true,
      synchronize: true,
      ssl: { rejectUnauthorized: false },
    }),
    AuthModule,
    UserModule,
    DoctorModule,
    QueueModule,
    AppointmentModule,
  ],
})
export class AppModule {}
