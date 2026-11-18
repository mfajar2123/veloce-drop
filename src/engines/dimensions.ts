export type DimensionUnit = 'px' | 'cm' | 'mm' | 'in' | '%';
export function toPixels(value:number,unit:DimensionUnit,dpi:number,source:number):number {
  switch(unit){case 'px':return value;case 'cm':return value*dpi/2.54;case 'mm':return value*dpi/25.4;case 'in':return value*dpi;case '%':return value*source/100;}
}
export function fromPixels(value:number,unit:DimensionUnit,dpi:number,source:number):number {
  switch(unit){case 'px':return value;case 'cm':return value*2.54/dpi;case 'mm':return value*25.4/dpi;case 'in':return value/dpi;case '%':return value/source*100;}
}
