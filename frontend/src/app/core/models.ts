export interface Section {
  _id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
}

/** Porta do serviço: metadado pesquisável, não renderizado no card. */
export interface ServicePort {
  name: string;
  number: number;
}

export interface Service {
  _id: string;
  name: string;
  sectionId: string;
  icon: string;
  color: string;
  tags: string[];
  ports: ServicePort[];
  publicUrl: string | null;
  localUrl: string;
  note: string;
  enabled: boolean;
  order: number;
}
