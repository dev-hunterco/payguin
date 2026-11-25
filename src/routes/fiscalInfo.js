import { Router } from 'express';

export function fiscalInfoRoutes() {
  const router = Router();

  // GET /v3/fiscalInfo/nbsCodes
  router.get('/v3/fiscalInfo/nbsCodes', (req, res) => {
    const search = (req.query.description || '').toLowerCase();
    let codes = [
      { id: '1', code: '1.0101', description: 'Serviços de informática' },
      { id: '2', code: '1.0102', description: 'Desenvolvimento de software' },
      { id: '3', code: '1.0103', description: 'Licenciamento de software' },
      { id: '4', code: '1.0104', description: 'Consultoria em TI' },
      { id: '5', code: '1.0105', description: 'Suporte técnico' },
      { id: '6', code: '1.0201', description: 'Serviços de engenharia' },
      { id: '7', code: '1.0301', description: 'Serviços de contabilidade' },
      { id: '8', code: '1.0401', description: 'Serviços jurídicos' },
      { id: '9', code: '1.0501', description: 'Serviços de marketing' },
      { id: '10', code: '1.0601', description: 'Serviços de design' },
    ];

    if (search) {
      codes = codes.filter(c => c.description.toLowerCase().includes(search));
    }

    res.json({ object: 'list', data: codes, totalCount: codes.length });
  });

  // GET /v3/fiscalInfo/federalServiceCodes
  router.get('/v3/fiscalInfo/federalServiceCodes', (req, res) => {
    const search = (req.query.description || '').toLowerCase();
    let codes = [
      { code: '010101', description: 'Análise e desenvolvimento de sistemas.' },
      { code: '010201', description: 'Programação.' },
      { code: '010301', description: 'Processamento de dados, textos, imagens, vídeos, páginas eletrônicas, aplicativos e sistemas de informação, entre outros formatos, e congêneres.' },
      { code: '010302', description: 'Armazenamento ou hospedagem de dados, textos, imagens, vídeos, páginas eletrônicas, aplicativos e sistemas de informação, entre outros formatos, e congêneres.' },
      { code: '010401', description: 'Elaboração de programas de computadores, inclusive de jogos eletrônicos, independentemente da arquitetura construtiva da máquina em que o programa será executado, incluindo tablets, smartphones e congêneres.' },
      { code: '010501', description: 'Licenciamento ou cessão de direito de uso de programas de computação.' },
      { code: '010601', description: 'Assessoria e consultoria em informática.' },
      { code: '010701', description: 'Suporte técnico em informática, inclusive instalação, configuração e manutenção de programas de computação e bancos de dados.' },
      { code: '010801', description: 'Planejamento, confecção, manutenção e atualização de páginas eletrônicas.' },
      { code: '010901', description: 'Disponibilização, sem cessão definitiva, de conteúdos de áudio por meio da internet.' },
      { code: '010902', description: 'Disponibilização, sem cessão definitiva, de conteúdos de vídeo, imagem e texto por meio da internet.' },
      { code: '020101', description: 'Serviços de pesquisas e desenvolvimento de qualquer natureza.' },
      { code: '030201', description: 'Cessão de direito de uso de marcas e de sinais de propaganda.' },
      { code: '040101', description: 'Medicina.' },
      { code: '040102', description: 'Biomedicina.' },
      { code: '040201', description: 'Análises clínicas.' },
      { code: '040601', description: 'Enfermagem, inclusive serviços auxiliares.' },
      { code: '040901', description: 'Terapias de qualquer espécie destinadas ao tratamento físico, orgânico e mental.' },
      { code: '041201', description: 'Odontologia.' },
      { code: '041601', description: 'Psicologia.' },
      { code: '050101', description: 'Medicina veterinária.' },
      { code: '060101', description: 'Barbearia, cabeleireiros, manicuros, pedicuros e congêneres.' },
      { code: '060401', description: 'Ginástica, dança, esportes, natação, artes marciais e demais atividades físicas.' },
      { code: '070101', description: 'Engenharia.' },
      { code: '070104', description: 'Arquitetura, urbanismo.' },
      { code: '070201', description: 'Execução, por administração, de obras de construção civil, hidráulica ou elétrica e de outras obras semelhantes.' },
      { code: '070401', description: 'Demolição.' },
      { code: '080101', description: 'Ensino regular pré-escolar, fundamental e médio.' },
      { code: '080102', description: 'Ensino superior.' },
      { code: '080201', description: 'Instrução, treinamento, orientação pedagógica e educacional, avaliação de conhecimentos de qualquer natureza.' },
      { code: '090101', description: 'Hospedagem de qualquer natureza em hotéis e congêneres.' },
      { code: '100101', description: 'Agenciamento, corretagem ou intermediação de câmbio.' },
      { code: '100801', description: 'Agenciamento de publicidade e propaganda, inclusive o agenciamento de veiculação por quaisquer meios.' },
      { code: '100901', description: 'Representação de qualquer natureza, inclusive comercial.' },
      { code: '110201', description: 'Vigilância, segurança ou monitoramento de bens, pessoas e semoventes.' },
      { code: '120101', description: 'Espetáculos teatrais.' },
      { code: '120701', description: 'Shows, ballet, danças, desfiles, bailes, óperas, concertos, recitais, festivais e congêneres.' },
      { code: '130301', description: 'Fotografia e cinematografia, inclusive revelação, ampliação, cópia, reprodução, trucagem e congêneres.' },
      { code: '140101', description: 'Lubrificação, limpeza, lustração, revisão, carga e recarga, conserto, restauração, blindagem, manutenção e conservação de máquinas, veículos, aparelhos, equipamentos, motores, elevadores ou de qualquer objeto.' },
      { code: '140201', description: 'Assistência técnica.' },
      { code: '141001', description: 'Tinturaria e lavanderia.' },
      { code: '150101', description: 'Administração de fundos quaisquer, de consórcio, de cartão de crédito ou débito e congêneres.' },
      { code: '150201', description: 'Abertura de conta-corrente no País, bem como a manutenção da referida conta ativa e inativa.' },
      { code: '150602', description: 'Abono de firmas.' },
      { code: '150703', description: 'Acesso a outro banco e à rede compartilhada.' },
      { code: '160101', description: 'Serviços de transporte coletivo municipal rodoviário de passageiros.' },
      { code: '170101', description: 'Assessoria ou consultoria de qualquer natureza, não contida em outros itens desta lista.' },
      { code: '170401', description: 'Recrutamento, agenciamento, seleção e colocação de mão-de-obra.' },
      { code: '170501', description: 'Fornecimento de mão-de-obra, mesmo em caráter temporário.' },
      { code: '170601', description: 'Propaganda e publicidade, inclusive promoção de vendas, planejamento de campanhas ou sistemas de publicidade.' },
      { code: '171401', description: 'Advocacia.' },
      { code: '171601', description: 'Auditoria.' },
      { code: '171901', description: 'Contabilidade, inclusive serviços técnicos e auxiliares.' },
      { code: '172001', description: 'Consultoria e assessoria econômica ou financeira.' },
      { code: '180101', description: 'Serviços de regulação de sinistros vinculados a contratos de seguros.' },
      { code: '200101', description: 'Serviços portuários, ferroportuários, utilização de porto e congêneres.' },
      { code: '210101', description: 'Serviços de registros públicos, cartorários e notariais.' },
      { code: '230101', description: 'Serviços de programação e comunicação visual.' },
      { code: '250101', description: 'Funerais, inclusive fornecimento de caixão, urna ou esquifes e congêneres.' },
      { code: '270101', description: 'Serviços de assistência social.' },
      { code: '300101', description: 'Serviços de biologia e biotecnologia.' },
      { code: '300102', description: 'Serviços de química.' },
      { code: '340101', description: 'Serviços de investigações particulares, detetives e congêneres.' },
      { code: '350101', description: 'Serviços de reportagem e jornalismo.' },
      { code: '360101', description: 'Serviços de meteorologia.' },
      { code: '400101', description: 'Obras de arte sob encomenda.' },
    ];

    if (search) {
      codes = codes.filter(c => c.description.toLowerCase().includes(search));
    }

    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const paged = codes.slice(offset, offset + limit);

    res.json({
      object: 'list',
      hasMore: offset + limit < codes.length,
      totalCount: codes.length,
      limit,
      offset,
      data: paged,
    });
  });

  // GET /v3/fiscalInfo/operationIndicatorCodes
  router.get('/v3/fiscalInfo/operationIndicatorCodes', (req, res) => {
    res.json({
      object: 'list',
      data: [
        { id: '1', code: 'E', description: 'Exportação' },
        { id: '2', code: 'I', description: 'Importação' },
        { id: '3', code: 'N', description: 'Nenhum' },
      ],
      totalCount: 3,
    });
  });

  return router;
}
