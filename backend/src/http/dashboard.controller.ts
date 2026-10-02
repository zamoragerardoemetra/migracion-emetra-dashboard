import { Controller, Get, Query, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import ExcelJS from 'exceljs';
import { DashboardService, defaultPeriod } from '../application/dashboard.service';
@Controller('api') export class DashboardController {constructor(private readonly service:DashboardService){}
 @Get('health') health(){return {status:'ok'};}
 @Get('catalogo') catalogo(){return {rubros:require('../infra/queries').RUBROS,camaras:require('../infra/queries').CAMARAS};}
 @Get('dashboard') summary(@Query('inicio') inicio?:string,@Query('fin') fin?:string,@Query('id_camara') camera='TODAS'){const p=defaultPeriod();return this.service.summary(inicio??p.inicio,fin??p.fin,camera);}
 @Get('detalle') detail(@Query('inicio') inicio:string,@Query('fin') fin:string,@Query('rubro') kind:string){return this.service.daily(inicio,fin,kind);}
 @Get('exportar') async export(@Query('tipo') tipo:string,@Query('inicio') inicio:string,@Query('fin') fin:string,@Query('id_camara') camera='TODAS',@Query('rubro') kind:string,@Res({passthrough:true}) res:Response){
 const p=defaultPeriod();inicio=inicio??p.inicio;fin=fin??p.fin;
 if(tipo!=='general'&&tipo!=='detalle')throw new (require('@nestjs/common').BadRequestException)('Tipo inválido');
 const workbook=new ExcelJS.Workbook();workbook.creator='EMETRA';
 const sheet=workbook.addWorksheet(tipo==='general'?'Resumen':'Detalle');
 sheet.addRow(['Dashboard de Ingresos EMETRA']);sheet.addRow([`Del ${inicio} al ${fin}`]);sheet.addRow([]);
 const rowHeader=(s:ExcelJS.Worksheet,values:string[])=>{const row=s.addRow(values);row.font={bold:true,color:{argb:'FFFFFFFF'}};row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF003366'}};};
 if(tipo==='detalle') {const rows=await this.service.daily(inicio,fin,kind);sheet.addRow([`Rubro: ${kind}`]);rowHeader(sheet,['Fecha','Cantidad impuesta','Monto impuesto','Cantidad pagada','Monto pagado']);for(const r of rows)sheet.addRow([r.dia,r.total,r.monto,r.totalPagado,r.montoPagado]);}
 else {const s=await this.service.summary(inicio,fin,camera);rowHeader(sheet,['Rubro','Cantidad impuesta','Monto impuesto','Cantidad pagada','Monto pagado','Comparativo','Cantidad impuesta comparativa','Monto impuesto comparativo','Cantidad pagada comparativa','Monto pagado comparativo']);const put=(name:string,r:typeof s.totalRango,c:typeof s.totalComparativo)=>sheet.addRow([name,r.total,r.monto,r.totalPagado,r.montoPagado,s.tituloComparativo,c.total,c.monto,c.totalPagado,c.montoPagado]);put('Totales generales',s.totalRango,s.totalComparativo);for(const r of s.rubros)put(r.nombre,r.rango,r.comparativo);
 const cs=workbook.addWorksheet('Cámaras');cs.addRow([s.camara]);rowHeader(cs,['Fecha','Captadas','Impuestas','No impuestas','Efectividad %','Pendientes','Buses']);for(const r of s.camaras)cs.addRow([r.dia,r.captadas,r.impuestas,r.noImpuestas,r.efectividad,r.pendientes,r.buses]);cs.columns.forEach(c=>c.width=20);}
 sheet.columns.forEach(c=>c.width=23);const buf=await workbook.xlsx.writeBuffer();res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.setHeader('Content-Disposition',`attachment; filename="dashboard_emetra_${tipo}.xlsx"`);res.setHeader('Cache-Control','no-store');return new StreamableFile(Buffer.from(buf));}
}
