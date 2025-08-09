import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserService } from './user/user.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const userService = app.get(UserService);

  app.enableCors({
    origin: 'https://allo-health-teal.vercel.app', 
    credentials: true,
  });

  const existing = await userService.findByUsername('frontdesk');
  if (!existing) {
    await userService.createUser('frontdesk', '123456');
    console.log('✅ Created test user: frontdesk / 123456');
  }

  // ✅ allow EC2 access
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();


