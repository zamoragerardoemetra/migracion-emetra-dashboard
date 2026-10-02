import { Rubro } from '../infra/queries';
export interface Period { inicio: string; fin: string }
export interface Params extends Period { idCamara: string }
export interface Totals { total: number; monto: number; totalPagado: number; montoPagado: number }
export interface Daily extends Totals { dia: string }
export interface CameraDaily { dia: string; captadas: number; impuestas: number; noImpuestas: number; pendientes: number; buses: number; efectividad: number }
export interface Summary { periodo: Period; comparativo: Period; tituloComparativo: string; camara: string; rubros: {nombre:Rubro; rango:Totals; comparativo:Totals}[]; totalRango:Totals; totalComparativo:Totals; camaras:CameraDaily[]; totalCamaras:Omit<CameraDaily,'dia'> }
export interface DashboardPort { summary(params: Params): Promise<Summary>; daily(period:Period, kind:Rubro): Promise<Daily[]> }
