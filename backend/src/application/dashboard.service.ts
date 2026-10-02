import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DashboardPort, Params, Period } from '../domain/dashboard';
import { CAMARAS, RUBROS, Rubro } from '../infra/queries';
export const DASHBOARD_PORT = Symbol('DASHBOARD_PORT');
const dateParts=(s:string)=>{const m=/^(\d{2})-(\d{2})-(\d{4})$/.exec(s);if(!m)throw new BadRequestException('Fecha inválida: DD-MM-YYYY');const d=new Date(Date.UTC(+m[3],+m[2]-1,+m[1]));if(d.getUTCFullYear()!==+m[3]||d.getUTCMonth()!==+m[2]-1||d.getUTCDate()!==+m[1])throw new BadRequestException('Fecha inexistente');return d;};
export function validPeriod(inicio:string,fin:string):Period {const a=dateParts(inicio),b=dateParts(fin);if(a>b)throw new BadRequestException('La fecha inicial es mayor que la final');if((b.getTime()-a.getTime())/86400000>366)throw new BadRequestException('Máximo 366 días por consulta');return {inicio,fin};}
export function validCamera(id:string) {if(!Object.hasOwn(CAMARAS,id))throw new BadRequestException('Cámara no válida');return id;}
export function validKind(value:string):Rubro {if(!(RUBROS as readonly string[]).includes(value))throw new BadRequestException('Rubro no válido');return value as Rubro;}
export function defaultPeriod():Period {const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Guatemala',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date()).split('/');return {inicio:`01-${parts[1]}-${parts[2]}`,fin:parts.join('-')};}
@Injectable() export class DashboardService { constructor(@Inject(DASHBOARD_PORT) private readonly port:DashboardPort) {} summary(inicio:string,fin:string,idCamara:string){return this.port.summary({...validPeriod(inicio,fin),idCamara:validCamera(idCamara)} as Params)} daily(inicio:string,fin:string,kind:string){return this.port.daily(validPeriod(inicio,fin),validKind(kind))} }
