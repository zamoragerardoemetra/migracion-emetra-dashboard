import { Args, Field, Float, Int, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { DashboardService, defaultPeriod } from '../application/dashboard.service';
@ObjectType() class TotalsG { @Field(()=>Int) total!:number; @Field(()=>Float) monto!:number; @Field(()=>Int) totalPagado!:number; @Field(()=>Float) montoPagado!:number; }
@ObjectType() class PeriodG { @Field() inicio!:string;@Field() fin!:string; }
@ObjectType() class RubroG { @Field() nombre!:string;@Field(()=>TotalsG) rango!:TotalsG;@Field(()=>TotalsG) comparativo!:TotalsG; }
@ObjectType() class CameraG { @Field() dia!:string;@Field(()=>Int) captadas!:number;@Field(()=>Int) impuestas!:number;@Field(()=>Int) noImpuestas!:number;@Field(()=>Int) pendientes!:number;@Field(()=>Int) buses!:number;@Field(()=>Float) efectividad!:number; }
@ObjectType() class CameraTotalG { @Field(()=>Int) captadas!:number;@Field(()=>Int) impuestas!:number;@Field(()=>Int) noImpuestas!:number;@Field(()=>Int) pendientes!:number;@Field(()=>Int) buses!:number;@Field(()=>Float) efectividad!:number; }
@ObjectType() class DashboardG { @Field(()=>PeriodG) periodo!:PeriodG;@Field(()=>PeriodG) comparativo!:PeriodG;@Field() tituloComparativo!:string;@Field() camara!:string;@Field(()=>[RubroG]) rubros!:RubroG[];@Field(()=>TotalsG) totalRango!:TotalsG;@Field(()=>TotalsG) totalComparativo!:TotalsG;@Field(()=>[CameraG]) camaras!:CameraG[];@Field(()=>CameraTotalG) totalCamaras!:CameraTotalG; }
@ObjectType() class DailyG extends TotalsG { @Field() dia!:string; }
@Resolver() export class DashboardResolver {constructor(private readonly service:DashboardService){}
 @Query(()=>DashboardG) dashboard(@Args('inicio',{nullable:true}) inicio?:string,@Args('fin',{nullable:true}) fin?:string,@Args('idCamara',{nullable:true}) idCamara?:string){const p=defaultPeriod();return this.service.summary(inicio??p.inicio,fin??p.fin,idCamara??'TODAS');}
 @Query(()=>[DailyG]) detalleDiario(@Args('inicio') inicio:string,@Args('fin') fin:string,@Args('rubro') rubro:string){return this.service.daily(inicio,fin,rubro);}
}
