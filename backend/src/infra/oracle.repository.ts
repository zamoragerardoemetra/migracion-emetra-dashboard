import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as oracledb from 'oracledb';
import { DashboardPort, Params, Period, Totals, Daily, CameraDaily, Summary } from '../domain/dashboard';
import { CAMARAS, RUBROS, Rubro, sqlRubro, sqlDetalle, sqlCepos, sqlDetalleCepos, sqlCamara } from './queries';
const n=(v:unknown)=>Number(v ?? 0);
const totals=(r:Record<string,unknown>={}):Totals=>({total:n(r.TOTAL),monto:n(r.MONTO),totalPagado:n(r.TOTAL_PAGADO),montoPagado:n(r.MONTO_PAGADO)});
const zero=()=>totals();
const add=(a:Totals,b:Totals)=>{a.total+=b.total;a.monto+=b.monto;a.totalPagado+=b.totalPagado;a.montoPagado+=b.montoPagado;};
@Injectable() export class OracleRepository implements DashboardPort,OnModuleInit,OnModuleDestroy {
 private readonly log=new Logger(OracleRepository.name); private pool?:oracledb.Pool;
 async onModuleInit(){const {ORACLE_USER,ORACLE_PASSWORD,ORACLE_CONNECT_STRING}=process.env;if(!ORACLE_USER||!ORACLE_PASSWORD||!ORACLE_CONNECT_STRING)throw new Error('Configure ORACLE_USER, ORACLE_PASSWORD y ORACLE_CONNECT_STRING');
 // Thin es el modo predeterminado; no cargar Instant Client.
 if(!oracledb.thin)throw new Error("Este backend requiere Oracle Thin; revise otras llamadas a initOracleClient");
 this.pool=await oracledb.createPool({user:ORACLE_USER,password:ORACLE_PASSWORD,connectString:ORACLE_CONNECT_STRING,poolMin:1,poolMax:4,poolIncrement:1,queueTimeout:15000});const conn=await this.pool.getConnection();try{await conn.execute('SELECT 1 FROM DUAL');}finally{await conn.close();}this.log.log('Oracle Thin: conexión verificada; pool inicializado');}
 async onModuleDestroy(){await this.pool?.close(10);}
 private async query(sql:string,binds:{inicio:string;fin:string;id_camara?:string}){if(!this.pool)throw new Error('Oracle no inicializado');const conn=await this.pool.getConnection();try {const result=await conn.execute<Record<string,unknown>>(sql,binds,{outFormat:oracledb.OUT_FORMAT_OBJECT});return result.rows??[];} finally {await conn.close();}}
 private async one(sql:string,p:Period){return totals((await this.query(sql,p))[0]);}
 async daily(period:Period,kind:Rubro):Promise<Daily[]>{const rows=await this.query(kind==='Cepos'?sqlDetalleCepos:sqlDetalle(kind),period);return rows.map(r=>({dia:String(r.DIA),...totals(r)}));}
 async summary(params:Params):Promise<Summary>{const {inicio,fin,idCamara}=params;const period={inicio,fin};const [day,month,year]=inicio.split('-').map(Number);const [,endMonth,endYear]=fin.split('-').map(Number);const same=month===endMonth&&year===endYear;const comp:Period=same?{inicio:`01-${String(month).padStart(2,'0')}-${year}`,fin:`${String(new Date(Date.UTC(year,month,0)).getUTCDate()).padStart(2,'0')}-${String(month).padStart(2,'0')}-${year}`}:{...period};
 const rubros=[] as Summary['rubros'];const totalRango=zero(),totalComparativo=zero();
 // Mantiene el cálculo del PHP. Se consulta de forma secuencial para respetar el pool Oracle pequeño.
 for(const kind of RUBROS){const sql=kind==='Cepos'?sqlCepos:sqlRubro(kind);const rango=await this.one(sql,period);const comparativo= same&&period.inicio===comp.inicio&&period.fin===comp.fin?rango:await this.one(sql,comp);rubros.push({nombre:kind,rango,comparativo});add(totalRango,rango);add(totalComparativo,comparativo);}
 const cameraFilter=idCamara==='TODAS'?' AND A.ID_CAMARA IN (12555,12556,5635,12497,12501,12502,5348,12498,5351,12716,12493,12705,12714,12748,12745,12747) ':' AND A.ID_CAMARA=:id_camara ';
 const binds=idCamara==='TODAS'?period:{...period,id_camara:idCamara};const rows=await this.query(sqlCamara(cameraFilter),binds);
 const camaras:CameraDaily[]=rows.map(r=>{const captadas=n(r.CAPTADAS),impuestas=n(r.IMPUESTAS);return {dia:String(r.DIA),captadas,impuestas,noImpuestas:n(r.NO_IMPUESTAS),pendientes:n(r.PENDIENTES),buses:n(r.BUSES),efectividad:captadas?Math.round(impuestas*10000/captadas)/100:0};});
 const totalCamaras={captadas:0,impuestas:0,noImpuestas:0,pendientes:0,buses:0,efectividad:0};for(const r of camaras){totalCamaras.captadas+=r.captadas;totalCamaras.impuestas+=r.impuestas;totalCamaras.noImpuestas+=r.noImpuestas;totalCamaras.pendientes+=r.pendientes;totalCamaras.buses+=r.buses;}totalCamaras.efectividad=totalCamaras.captadas?Math.round(totalCamaras.impuestas*10000/totalCamaras.captadas)/100:0;
 return {periodo:period,comparativo:comp,tituloComparativo:same?'Totales del mes':'Totales del período',camara:`${idCamara} - ${CAMARAS[idCamara]}`,rubros,totalRango,totalComparativo,camaras,totalCamaras};}
}
