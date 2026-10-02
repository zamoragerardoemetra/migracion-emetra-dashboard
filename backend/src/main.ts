import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap(){const app=await NestFactory.create(AppModule);app.getHttpAdapter().getInstance().disable('x-powered-by');app.enableShutdownHooks();app.enableCors({origin:process.env.FRONTEND_ORIGIN?.split(',')??[],methods:['GET','POST'],allowedHeaders:['Content-Type'],credentials:false});const port=Number(process.env.PORT??3001);await app.listen(port,'0.0.0.0');} bootstrap();
