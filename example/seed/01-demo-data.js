/**
 * Dados de demonstração do Burrow.
 *
 * Este script é montado em /docker-entrypoint-initdb.d do container do Mongo, o que
 * significa que ele roda UMA única vez: na primeiríssima subida, quando o volume de
 * dados ainda está vazio. Se o banco já tem qualquer coisa dentro, o Mongo ignora
 * este arquivo. Não há como ele apagar ou sobrescrever dados existentes.
 *
 * Os serviços aqui são fictícios: domínios em example.com e IPs da faixa 10.0.0.0/8.
 * Serve só para o dashboard subir com cara de gente, em vez de uma tela vazia.
 */

const now = new Date();

// Os _id são fixos para que os serviços possam referenciar suas seções.
const infra = ObjectId('000000000000000000000001');
const media = ObjectId('000000000000000000000002');
const monitoring = ObjectId('000000000000000000000003');
const downloads = ObjectId('000000000000000000000004');

db.sections.insertMany([
  { _id: infra, name: 'Infraestrutura', icon: 'fas fa-server', color: '#e57000', order: 0, createdAt: now, updatedAt: now, __v: 0 },
  { _id: media, name: 'Mídia', icon: 'fas fa-photo-film', color: '#9b5de5', order: 1, createdAt: now, updatedAt: now, __v: 0 },
  { _id: monitoring, name: 'Monitoramento', icon: 'fas fa-chart-line', color: '#00b4d8', order: 2, createdAt: now, updatedAt: now, __v: 0 },
  { _id: downloads, name: 'Downloads', icon: 'fas fa-download', color: '#2a9d8f', order: 3, createdAt: now, updatedAt: now, __v: 0 },
]);

const service = (s) => ({
  tags: [],
  ports: [],
  publicUrl: null,
  localUrl: '',
  note: '',
  enabled: true,
  createdAt: now,
  updatedAt: now,
  __v: 0,
  ...s,
});

db.services.insertMany([
  // Infraestrutura
  service({
    name: 'Proxmox', sectionId: infra, icon: 'fas fa-server', color: '#e57000', order: 0,
    tags: ['virtualização', 'hypervisor', 'ssh', 'vnc'],
    // Mostra pra que serve a lista de portas: um host só, vários acessos. Os displays de
    // VNC seguem o padrão 5900 + n, então cada VM ganha o seu.
    ports: [
      { name: 'WebUI', number: 8006 },
      { name: 'SSH', number: 22 },
      { name: 'VNC for VM 101', number: 5901 },
      { name: 'VNC for VM 102', number: 5902 },
    ],
    publicUrl: 'https://proxmox.example.com', localUrl: 'https://10.0.0.10:8006',
    note: 'Hypervisor principal. Aqui rodam as VMs do lab. Busque por "22" ou "5901" para achar este card pela porta.',
  }),
  service({
    name: 'Portainer', sectionId: infra, icon: 'fab fa-docker', color: '#2496ed', order: 1,
    tags: ['docker', 'containers'],
    ports: [{ name: 'WebUI', number: 9443 }],
    publicUrl: 'https://portainer.example.com', localUrl: 'https://10.0.0.11:9443',
    note: 'Gerência dos containers.',
  }),
  service({
    name: 'Nginx Proxy Manager', sectionId: infra, icon: 'fas fa-shield-halved', color: '#f15833', order: 2,
    tags: ['proxy', 'ssl'],
    ports: [{ name: 'Admin', number: 81 }, { name: 'HTTPS', number: 443 }],
    localUrl: 'http://10.0.0.12:81',
    note: 'Reverse proxy e certificados. É por aqui que os subdomínios entram.',
  }),

  // Mídia
  service({
    name: 'Jellyfin', sectionId: media, icon: 'fas fa-film', color: '#aa5cc3', order: 0,
    tags: ['streaming', 'filmes', 'séries'],
    ports: [{ name: 'WebUI', number: 8096 }],
    publicUrl: 'https://media.example.com', localUrl: 'http://10.0.0.20:8096',
    note: 'Servidor de mídia da casa.',
  }),
  service({
    name: 'Immich', sectionId: media, icon: 'fas fa-images', color: '#4250af', order: 1,
    tags: ['fotos', 'backup'],
    ports: [{ name: 'WebUI', number: 2283 }],
    localUrl: 'http://10.0.0.21:2283',
    note: 'Backup das fotos do celular.',
  }),

  // Monitoramento
  service({
    name: 'Grafana', sectionId: monitoring, icon: 'fas fa-chart-line', color: '#f46800', order: 0,
    tags: ['dashboards', 'métricas'],
    ports: [{ name: 'WebUI', number: 3000 }],
    publicUrl: 'https://grafana.example.com', localUrl: 'http://10.0.0.30:3000',
  }),
  service({
    name: 'Prometheus', sectionId: monitoring, icon: 'fas fa-fire', color: '#e6522c', order: 1,
    tags: ['métricas', 'scraping'],
    ports: [{ name: 'WebUI', number: 9090 }],
    localUrl: 'http://10.0.0.30:9090',
  }),
  service({
    name: 'Uptime Kuma', sectionId: monitoring, icon: 'fas fa-heart-pulse', color: '#5cdd8b', order: 2,
    tags: ['uptime', 'alertas'],
    ports: [{ name: 'WebUI', number: 3001 }],
    localUrl: 'http://10.0.0.31:3001',
    note: 'Exemplo de serviço desligado — repare que o card aparece apagado.',
    enabled: false,
  }),

  // Downloads
  service({
    name: 'MeTube', sectionId: downloads, icon: 'fab fa-youtube', color: '#ff0000', order: 0,
    tags: ['youtube', 'yt-dlp', 'vídeos'],
    ports: [{ name: 'WebUI', number: 8081 }],
    localUrl: 'http://10.0.0.40:8081',
    note: 'Baixador de vídeos do YouTube (yt-dlp com interface web).',
  }),
]);

print(`[burrow] demo: ${db.sections.countDocuments()} seções, ${db.services.countDocuments()} serviços.`);
