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


  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();


