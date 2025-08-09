import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserService } from './user/user.service';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const userService = app.get(UserService);


  app.enableCors({
    origin: 'http://localhost:3001', 
    credentials: true,
  });

  const existing = await userService.findByUsername('frontdesk');
  if (!existing) {
    await userService.createUser('frontdesk', '123456');
    console.log('✅ Created test user: frontdesk / 123456');
  }

  await app.listen(3000);
}
bootstrap();
