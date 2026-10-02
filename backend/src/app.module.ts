import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DashboardService,DASHBOARD_PORT } from './application/dashboard.service';
import { OracleRepository } from './infra/oracle.repository';
import { DashboardResolver } from './http/dashboard.resolver';
import { DashboardController } from './http/dashboard.controller';
@Module({imports:[GraphQLModule.forRoot<ApolloDriverConfig>({driver:ApolloDriver,autoSchemaFile:true,playground:false,introspection:process.env.NODE_ENV!=='production'})],controllers:[DashboardController],providers:[DashboardService,OracleRepository,{provide:DASHBOARD_PORT,useExisting:OracleRepository},DashboardResolver]}) export class AppModule{}
