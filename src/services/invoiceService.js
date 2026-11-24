import { makeId } from '../helpers/ids.js';
import { centsToDecimal, decimalToCents } from '../models/responses.js';

export class InvoiceService {
  constructor(db) {
    this.db = db;
  }

  create(accountId, data) {
    const id = makeId('inv');
    const value = decimalToCents(data.value);

    this.db.prepare(`
      INSERT INTO invoices (id, account_id, payment_id, customer_id, service_description,
        observations, value, deductions, effective_date, external_reference, iss_retained,
        municipal_service_id, municipal_service_code, municipal_service_name, taxes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, accountId,
      data.payment || null,
      data.customer || null,
      data.serviceDescription || null,
      data.observations || null,
      value,
      decimalToCents(data.deductions) || 0,
      data.effectiveDate || new Date().toISOString().split('T')[0],
      data.externalReference || null,
      data.issRetained ? 1 : 0,
      data.municipalServiceId || null,
      data.municipalServiceCode || null,
      data.municipalServiceName || null,
      data.taxes ? JSON.stringify(data.taxes) : null
    );

    return this.format(this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(id));
  }

  getById(id, accountId) {
    const row = this.db.prepare('SELECT * FROM invoices WHERE id = ? AND account_id = ?').get(id, accountId);
    return row ? this.format(row) : null;
  }

  getByIdGlobal(id) {
    const row = this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    return row ? this.format(row) : null;
  }

  list(accountId, { offset = 0, limit = 10, status } = {}) {
    let where = 'account_id = ?';
    const params = [accountId];

    if (status) { where += ' AND status = ?'; params.push(status); }

    const total = this.db.prepare(`SELECT COUNT(*) as count FROM invoices WHERE ${where}`).get(...params).count;
    params.push(limit, offset);
    const rows = this.db.prepare(`SELECT * FROM invoices WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params);

    return { data: rows.map(r => this.format(r)), totalCount: total };
  }

  getMunicipalServices(description) {
    const all = [
      { id: '1', code: '01.01', description: 'Análise e desenvolvimento de sistemas' },
      { id: '2', code: '01.02', description: 'Programação' },
      { id: '3', code: '01.03', description: 'Processamento, armazenamento ou hospedagem de dados, textos, imagens, vídeos, páginas eletrônicas, aplicativos e sistemas de informação, entre outros formatos, e congêneres' },
      { id: '4', code: '01.04', description: 'Elaboração de programas de computadores, inclusive de jogos eletrônicos, independentemente da arquitetura construtiva da máquina em que o programa será executado, incluindo tablets, smartphones e congêneres' },
      { id: '5', code: '01.05', description: 'Licenciamento ou cessão de direito de uso de programas de computação' },
      { id: '6', code: '01.06', description: 'Assessoria e consultoria em informática' },
      { id: '7', code: '01.07', description: 'Suporte técnico em informática, inclusive instalação, configuração e manutenção de programas de computação e bancos de dados' },
      { id: '8', code: '01.08', description: 'Planejamento, confecção, manutenção e atualização de páginas eletrônicas' },
      { id: '9', code: '01.09', description: 'Disponibilização, sem cessão definitiva, de conteúdos de áudio, vídeo, imagem e texto por meio da internet' },
      { id: '10', code: '02.01', description: 'Serviços de pesquisas e desenvolvimento de qualquer natureza' },
      { id: '11', code: '03.02', description: 'Cessão de direito de uso de marcas e de sinais de propaganda' },
      { id: '12', code: '03.03', description: 'Exploração de salões de festas, centro de convenções, escritórios virtuais, stands, quadras esportivas, estádios, ginásios, auditórios, casas de espetáculos, parques de diversões, canchas e congêneres, para realização de eventos ou negócios de qualquer natureza' },
      { id: '13', code: '03.04', description: 'Locação, sublocação, arrendamento, direito de passagem ou permissão de uso, compartilhado ou não, de ferrovia, rodovia, postes, cabos, dutos e condutos de qualquer natureza' },
      { id: '14', code: '03.05', description: 'Cessão de andaimes, palcos, coberturas e outras estruturas de uso temporário' },
      { id: '15', code: '04.01', description: 'Medicina e biomedicina' },
      { id: '16', code: '04.02', description: 'Análises clínicas, patologia, eletricidade médica, radioterapia, quimioterapia, ultra-sonografia, ressonância magnética, radiologia, tomografia e congêneres' },
      { id: '17', code: '04.03', description: 'Hospitais, clínicas, laboratórios, sanatórios, manicômios, casas de saúde, prontos-socorros, ambulatórios e congêneres' },
      { id: '18', code: '04.04', description: 'Instrumentação cirúrgica' },
      { id: '19', code: '04.05', description: 'Acupuntura' },
      { id: '20', code: '04.06', description: 'Enfermagem, inclusive serviços auxiliares' },
      { id: '21', code: '04.07', description: 'Serviços farmacêuticos' },
      { id: '22', code: '04.08', description: 'Terapia ocupacional, fisioterapia e fonoaudiologia' },
      { id: '23', code: '04.09', description: 'Terapias de qualquer espécie destinadas ao tratamento físico, orgânico e mental' },
      { id: '24', code: '04.10', description: 'Nutrição' },
      { id: '25', code: '04.11', description: 'Obstetrícia' },
      { id: '26', code: '04.12', description: 'Odontologia' },
      { id: '27', code: '04.13', description: 'Ortóptica' },
      { id: '28', code: '04.14', description: 'Próteses sob encomenda' },
      { id: '29', code: '04.15', description: 'Psicanálise' },
      { id: '30', code: '04.16', description: 'Psicologia' },
      { id: '31', code: '04.17', description: 'Casas de repouso e de recuperação, creches, asilos e congêneres' },
      { id: '32', code: '04.18', description: 'Inseminação artificial, fertilização in vitro e congêneres' },
      { id: '33', code: '04.19', description: 'Bancos de sangue, leite, pele, olhos, óvulos, sêmen e congêneres' },
      { id: '34', code: '04.20', description: 'Coleta de sangue, leite, tecidos, sêmen, órgãos e materiais biológicos de qualquer espécie' },
      { id: '35', code: '04.21', description: 'Unidade de atendimento, assistência ou tratamento móvel e congêneres' },
      { id: '36', code: '04.22', description: 'Planos de medicina de grupo ou individual e convênios para prestação de assistência médica, hospitalar, odontológica e congêneres' },
      { id: '37', code: '04.23', description: 'Outros planos de saúde que se cumpram através de serviços de terceiros contratados, credenciados, cooperados ou apenas pagos pelo operador do plano mediante indicação do beneficiário' },
      { id: '38', code: '05.01', description: 'Medicina veterinária e zootecnia' },
      { id: '39', code: '05.02', description: 'Hospitais, clínicas, ambulatórios, prontos-socorros e congêneres, na área veterinária' },
      { id: '40', code: '05.03', description: 'Laboratórios de análise na área veterinária' },
      { id: '41', code: '05.04', description: 'Inseminação artificial, fertilização in vitro e congêneres' },
      { id: '42', code: '05.05', description: 'Bancos de sangue e de órgãos e congêneres' },
      { id: '43', code: '05.06', description: 'Coleta de sangue, leite, tecidos, sêmen, órgãos e materiais biológicos de qualquer espécie' },
      { id: '44', code: '05.07', description: 'Unidade de atendimento, assistência ou tratamento móvel e congêneres' },
      { id: '45', code: '05.08', description: 'Guarda, tratamento, amestramento, embelezamento, alojamento e congêneres' },
      { id: '46', code: '05.09', description: 'Planos de atendimento e assistência médico-veterinária' },
      { id: '47', code: '06.01', description: 'Barbearia, cabeleireiros, manicuros, pedicuros e congêneres' },
      { id: '48', code: '06.02', description: 'Esteticistas, tratamento de pele, depilação e congêneres' },
      { id: '49', code: '06.03', description: 'Banhos, duchas, sauna, massagens e congêneres' },
      { id: '50', code: '06.04', description: 'Ginástica, dança, esportes, natação, artes marciais e demais atividades físicas' },
      { id: '51', code: '06.05', description: 'Centros de emagrecimento, spa e congêneres' },
      { id: '52', code: '06.06', description: 'Aplicação de tatuagens, piercings e congêneres' },
      { id: '53', code: '07.01', description: 'Engenharia, agronomia, agrimensura, arquitetura, geologia, urbanismo, paisagismo e congêneres' },
      { id: '54', code: '07.02', description: 'Execução, por administração, empreitada ou subempreitada, de obras de construção civil, hidráulica ou elétrica e de outras obras semelhantes, inclusive sondagem, perfuração de poços, escavação, drenagem e irrigação, terraplanagem, pavimentação, concretagem e a instalação e montagem de produtos, peças e equipamentos' },
      { id: '55', code: '07.03', description: 'Elaboração de planos diretores, estudos de viabilidade, estudos organizacionais e outros, relacionados com obras e serviços de engenharia; elaboração de anteprojetos, projetos básicos e projetos executivos para trabalhos de engenharia' },
      { id: '56', code: '07.04', description: 'Demolição' },
      { id: '57', code: '07.05', description: 'Reparação, conservação e reforma de edifícios, estradas, pontes, portos e congêneres' },
      { id: '58', code: '07.06', description: 'Colocação e instalação de tapetes, carpetes, assoalhos, cortinas, revestimentos de parede, vidros, divisórias, placas de gesso e congêneres, com material fornecido pelo tomador do serviço' },
      { id: '59', code: '07.07', description: 'Recuperação, raspagem, polimento e lustração de pisos e congêneres' },
      { id: '60', code: '07.08', description: 'Calafetação' },
      { id: '61', code: '07.09', description: 'Varrição, coleta, remoção, incineração, tratamento, reciclagem, separação e destinação final de lixo, rejeitos e outros resíduos quaisquer' },
      { id: '62', code: '07.10', description: 'Limpeza, manutenção e conservação de vias e logradouros públicos, imóveis, chaminés, piscinas, parques, jardins e congêneres' },
      { id: '63', code: '07.11', description: 'Decoração e jardinagem, inclusive corte e poda de árvores' },
      { id: '64', code: '07.12', description: 'Controle e tratamento de efluentes de qualquer natureza e de agentes físicos, químicos e biológicos' },
      { id: '65', code: '07.13', description: 'Dedetização, desinfecção, desinsetização, imunização, higienização, desratização, pulverização e congêneres' },
      { id: '66', code: '07.16', description: 'Florestamento, reflorestamento, semeadura, adubação, reparação de solo, plantio, silagem, colheita, corte e descascamento de árvores, silvicultura, exploração florestal e dos serviços congêneres' },
      { id: '67', code: '07.17', description: 'Escoramento, contenção de encostas e serviços congêneres' },
      { id: '68', code: '07.18', description: 'Limpeza e dragagem de rios, portos, canais, baías, lagos, lagoas, represas, açudes e congêneres' },
      { id: '69', code: '07.19', description: 'Acompanhamento e fiscalização da execução de obras de engenharia, arquitetura e urbanismo' },
      { id: '70', code: '07.20', description: 'Aerofotogrametria (inclusive interpretação), cartografia, mapeamento, levantamentos topográficos, batimétricos, geográficos, geodésicos, geológicos, geofísicos e congêneres' },
      { id: '71', code: '07.21', description: 'Pesquisa, perfuração, cimentação, mergulho, perfilagem, concretação, testemunhagem, pescaria, estimulação e outros serviços relacionados com a exploração e explotação de petróleo, gás natural e de outros recursos minerais' },
      { id: '72', code: '07.22', description: 'Nucleação e bombardeamento de nuvens e congêneres' },
      { id: '73', code: '08.01', description: 'Ensino regular pré-escolar, fundamental, médio e superior' },
      { id: '74', code: '08.02', description: 'Instrução, treinamento, orientação pedagógica e educacional, avaliação de conhecimentos de qualquer natureza' },
      { id: '75', code: '09.01', description: 'Hospedagem de qualquer natureza em hotéis, apart-service condominiais, flat, apart-hotéis, hotéis residência, residence-service, suite service, hotelaria marítima, motéis, pensões e congêneres' },
      { id: '76', code: '09.02', description: 'Agenciamento, organização, promoção, intermediação e execução de programas de turismo, passeios, viagens, excursões, hospedagens e congêneres' },
      { id: '77', code: '09.03', description: 'Guias de turismo' },
      { id: '78', code: '10.01', description: 'Agenciamento, corretagem ou intermediação de câmbio, de seguros, de cartões de crédito, de planos de saúde e de planos de previdência privada' },
      { id: '79', code: '10.02', description: 'Agenciamento, corretagem ou intermediação de títulos em geral, valores mobiliários e contratos quaisquer' },
      { id: '80', code: '10.03', description: 'Agenciamento, corretagem ou intermediação de direitos de propriedade industrial, artística ou literária' },
      { id: '81', code: '10.04', description: 'Agenciamento, corretagem ou intermediação de contratos de arrendamento mercantil (leasing), de franquia (franchising) e de faturização (factoring)' },
      { id: '82', code: '10.05', description: 'Agenciamento, corretagem ou intermediação de bens móveis ou imóveis, não abrangidos em outros itens ou subitens, inclusive aqueles realizados no âmbito de Bolsas de Mercadorias e Futuros, por quaisquer meios' },
      { id: '83', code: '10.06', description: 'Agenciamento marítimo' },
      { id: '84', code: '10.07', description: 'Agenciamento de notícias' },
      { id: '85', code: '10.08', description: 'Agenciamento de publicidade e propaganda, inclusive o agenciamento de veiculação por quaisquer meios' },
      { id: '86', code: '10.09', description: 'Representação de qualquer natureza, inclusive comercial' },
      { id: '87', code: '10.10', description: 'Distribuição de bens de terceiros' },
      { id: '88', code: '11.01', description: 'Guarda e estacionamento de veículos terrestres automotores, de aeronaves e de embarcações' },
      { id: '89', code: '11.02', description: 'Vigilância, segurança ou monitoramento de bens, pessoas e semoventes' },
      { id: '90', code: '11.03', description: 'Escolta, inclusive de veículos e cargas' },
      { id: '91', code: '11.04', description: 'Armazenamento, depósito, carga, descarga, arrumação e guarda de bens de qualquer espécie' },
      { id: '92', code: '11.05', description: 'Serviços relacionados ao monitoramento e rastreamento a distância de veículos, cargas, pessoas e semoventes em circulação ou movimento' },
      { id: '93', code: '12.01', description: 'Espetáculos teatrais' },
      { id: '94', code: '12.02', description: 'Exibições cinematográficas' },
      { id: '95', code: '12.03', description: 'Espetáculos circenses' },
      { id: '96', code: '12.04', description: 'Programas de auditório' },
      { id: '97', code: '12.05', description: 'Parques de diversões, centros de lazer e congêneres' },
      { id: '98', code: '12.06', description: 'Boates, taxi-dancing e congêneres' },
      { id: '99', code: '12.07', description: 'Shows, ballet, danças, desfiles, bailes, óperas, concertos, recitais, festivais e congêneres' },
      { id: '100', code: '12.08', description: 'Feiras, exposições, congressos e congêneres' },
      { id: '101', code: '12.09', description: 'Bilhares, boliches e diversões eletrônicas ou não' },
      { id: '102', code: '12.10', description: 'Corridas e competições de animais' },
      { id: '103', code: '12.11', description: 'Competições esportivas ou de destreza física ou intelectual, com ou sem a participação do espectador' },
      { id: '104', code: '12.12', description: 'Execução de música' },
      { id: '105', code: '12.13', description: 'Produção, mediante ou sem encomenda prévia, de eventos, espetáculos, entrevistas, shows, ballet, danças, desfiles, bailes, teatros, óperas, concertos, recitais, festivais e congêneres' },
      { id: '106', code: '12.14', description: 'Fornecimento de música para ambientes fechados ou não, mediante transmissão por qualquer processo' },
      { id: '107', code: '12.15', description: 'Desfiles de blocos carnavalescos ou folclóricos, trios elétricos e congêneres' },
      { id: '108', code: '12.16', description: 'Exibição de filmes, entrevistas, musicais, espetáculos, shows, concertos, desfiles, óperas, competições esportivas, de destreza intelectual ou congêneres' },
      { id: '109', code: '12.17', description: 'Recreação e animação, inclusive em festas e eventos de qualquer natureza' },
      { id: '110', code: '13.02', description: 'Fonografia ou gravação de sons, inclusive trucagem, dublagem, mixagem e congêneres' },
      { id: '111', code: '13.03', description: 'Fotografia e cinematografia, inclusive revelação, ampliação, cópia, reprodução, trucagem e congêneres' },
      { id: '112', code: '13.04', description: 'Reprografia, microfilmagem e digitalização' },
      { id: '113', code: '13.05', description: 'Composição gráfica, inclusive confecção de impressos gráficos, fotocomposição, clicheria, zincografia, litografia e fotolitografia' },
      { id: '114', code: '14.01', description: 'Lubrificação, limpeza, lustração, revisão, carga e recarga, conserto, restauração, blindagem, manutenção e conservação de máquinas, veículos, aparelhos, equipamentos, motores, elevadores ou de qualquer objeto' },
      { id: '115', code: '14.02', description: 'Assistência técnica' },
      { id: '116', code: '14.03', description: 'Recondicionamento de motores' },
      { id: '117', code: '14.04', description: 'Recauchutagem ou regeneração de pneus' },
      { id: '118', code: '14.05', description: 'Restauração, recondicionamento, acondicionamento, pintura, beneficiamento, lavagem, secagem, tingimento, galvanoplastia, anodização, corte, recorte, plastificação, costura, acabamento, polimento e congêneres de objetos quaisquer' },
      { id: '119', code: '14.06', description: 'Instalação e montagem de aparelhos, máquinas e equipamentos, inclusive montagem industrial, prestados ao usuário final, exclusivamente com material por ele fornecido' },
      { id: '120', code: '14.07', description: 'Colocação de molduras e congêneres' },
      { id: '121', code: '14.08', description: 'Encadernação, gravação e douração de livros, revistas e congêneres' },
      { id: '122', code: '14.09', description: 'Alfaiataria e costura, quando o material for fornecido pelo usuário final, exceto aviamento' },
      { id: '123', code: '14.10', description: 'Tinturaria e lavanderia' },
      { id: '124', code: '14.11', description: 'Tapeçaria e reforma de estofamentos em geral' },
      { id: '125', code: '14.12', description: 'Funilaria e lanternagem' },
      { id: '126', code: '14.13', description: 'Carpintaria e serralheria' },
      { id: '127', code: '14.14', description: 'Guincho intramunicipal, guindaste e içamento' },
      { id: '128', code: '15.01', description: 'Administração de fundos quaisquer, de consórcio, de cartão de crédito ou débito e congêneres, de carteira de clientes, de cheques pré-datados e congêneres' },
      { id: '129', code: '15.02', description: 'Abertura de contas em geral, inclusive conta-corrente, conta de investimentos e aplicação e caderneta de poupança, no País e no exterior, bem como a manutenção das referidas contas ativas e inativas' },
      { id: '130', code: '15.03', description: 'Locação e manutenção de cofres particulares, de terminais eletrônicos, de terminais de atendimento e de bens e equipamentos em geral' },
      { id: '131', code: '15.04', description: 'Fornecimento ou emissão de atestados em geral, inclusive atestado de idoneidade, atestado de capacidade financeira e congêneres' },
      { id: '132', code: '15.05', description: 'Cadastro, elaboração de ficha cadastral, renovação cadastral e congêneres, inclusão ou exclusão no Cadastro de Emitentes de Cheques sem Fundos – CCF ou em quaisquer outros bancos cadastrais' },
      { id: '133', code: '15.06', description: 'Emissão, reemissão e fornecimento de avisos, comprovantes e documentos em geral; abono de firmas; coleta e entrega de documentos, bens e valores; comunicação com outra agência ou com a administração central; licenciamento eletrônico de veículos; transferência de veículos; agenciamento fiduciário ou depositário; devolução de bens em custódia' },
      { id: '134', code: '15.07', description: 'Acesso, movimentação, atendimento e consulta a contas em geral, por qualquer meio ou processo, inclusive por telefone, fac-símile, internet e telex' },
      { id: '135', code: '15.08', description: 'Emissão, reemissão, alteração, cessão, substituição, cancelamento e registro de contrato de crédito; estudo, análise e avaliação de operações de crédito; emissão, concessão, alteração ou contratação de aval, fiança, anuência e congêneres; serviços relativos a abertura de crédito, para quaisquer fins' },
      { id: '136', code: '15.09', description: 'Arrendamento mercantil (leasing) de quaisquer bens, inclusive cessão de direitos e obrigações, substituição de garantia, alteração, cancelamento e registro de contrato, e demais serviços relacionados ao arrendamento mercantil (leasing)' },
      { id: '137', code: '15.10', description: 'Serviços relacionados a cobranças, recebimentos ou pagamentos em geral, de títulos quaisquer, de contas ou carnês, de câmbio, de tributos e por conta de terceiros' },
      { id: '138', code: '15.11', description: 'Devolução de títulos, protesto de títulos, sustação de protesto, manutenção de títulos, reapresentação de títulos, e demais serviços a eles relacionados' },
      { id: '139', code: '15.12', description: 'Custódia em geral, inclusive de títulos e valores mobiliários' },
      { id: '140', code: '15.13', description: 'Serviços relacionados a operações de câmbio em geral, edição, alteração, prorrogação, cancelamento e baixa de contrato de câmbio' },
      { id: '141', code: '15.14', description: 'Fornecimento, emissão, reemissão, renovação e manutenção de cartão magnético, cartão de crédito, cartão de débito, cartão salário e congêneres' },
      { id: '142', code: '15.15', description: 'Compensação de cheques e títulos quaisquer; serviços relacionados a depósito, inclusive depósito identificado, a saque de contas quaisquer, por qualquer meio ou processo' },
      { id: '143', code: '15.16', description: 'Emissão, reemissão, liquidação, alteração, cancelamento e baixa de ordens de pagamento, ordens de crédito e similares, por qualquer meio ou processo' },
      { id: '144', code: '15.17', description: 'Emissão, fornecimento, devolução, sustação, cancelamento e oposição de cheques quaisquer, avulso ou por talão' },
      { id: '145', code: '15.18', description: 'Serviços relacionados a crédito imobiliário, avaliação e vistoria de imóvel ou obra, análise técnica e jurídica, emissão, reemissão, alteração, transferência e renegociação de contrato, emissão e reemissão do termo de quitação e demais serviços relacionados a crédito imobiliário' },
      { id: '146', code: '16.01', description: 'Serviços de transporte coletivo municipal rodoviário, metroviário, ferroviário e aquaviário de passageiros' },
      { id: '147', code: '16.02', description: 'Outros serviços de transporte de natureza municipal' },
      { id: '148', code: '17.01', description: 'Assessoria ou consultoria de qualquer natureza, não contida em outros itens desta lista; análise, exame, pesquisa, coleta, compilação e fornecimento de dados e informações de qualquer natureza, inclusive cadastro e similares' },
      { id: '149', code: '17.02', description: 'Datilografia, digitação, estenografia, expediente, secretaria em geral, resposta audível, redação, edição, interpretação, revisão, tradução, apoio e infra-estrutura administrativa e congêneres' },
      { id: '150', code: '17.03', description: 'Planejamento, coordenação, programação ou organização técnica, financeira ou administrativa' },
      { id: '151', code: '17.04', description: 'Recrutamento, agenciamento, seleção e colocação de mão-de-obra' },
      { id: '152', code: '17.05', description: 'Fornecimento de mão-de-obra, mesmo em caráter temporário, inclusive de empregados ou trabalhadores, avulsos ou temporários, contratados pelo prestador de serviço' },
      { id: '153', code: '17.06', description: 'Propaganda e publicidade, inclusive promoção de vendas, planejamento de campanhas ou sistemas de publicidade, elaboração de desenhos, textos e demais materiais publicitários' },
      { id: '154', code: '17.08', description: 'Franquia (franchising)' },
      { id: '155', code: '17.09', description: 'Perícias, laudos, exames técnicos e análises técnicas' },
      { id: '156', code: '17.10', description: 'Planejamento, organização e administração de feiras, exposições, congressos e congêneres' },
      { id: '157', code: '17.11', description: 'Organização de festas e recepções; bufê' },
      { id: '158', code: '17.12', description: 'Administração em geral, inclusive de bens e negócios de terceiros' },
      { id: '159', code: '17.13', description: 'Leilão e congêneres' },
      { id: '160', code: '17.14', description: 'Advocacia' },
      { id: '161', code: '17.15', description: 'Arbitragem de qualquer espécie, inclusive jurídica' },
      { id: '162', code: '17.16', description: 'Auditoria' },
      { id: '163', code: '17.17', description: 'Análise de Organização e Métodos' },
      { id: '164', code: '17.18', description: 'Atuária e cálculos técnicos de qualquer natureza' },
      { id: '165', code: '17.19', description: 'Contabilidade, inclusive serviços técnicos e auxiliares' },
      { id: '166', code: '17.20', description: 'Consultoria e assessoria econômica ou financeira' },
      { id: '167', code: '17.21', description: 'Estatística' },
      { id: '168', code: '17.22', description: 'Cobrança em geral' },
      { id: '169', code: '17.23', description: 'Assessoria, análise, avaliação, atendimento, consulta, cadastro, seleção, gerenciamento de informações, administração de contas a receber ou a pagar e em geral, relacionados a operações de faturização (factoring)' },
      { id: '170', code: '17.24', description: 'Apresentação de palestras, conferências, seminários e congêneres' },
      { id: '171', code: '17.25', description: 'Inserção de textos, desenhos e outros materiais de propaganda e publicidade, em qualquer meio' },
      { id: '172', code: '18.01', description: 'Serviços de regulação de sinistros vinculados a contratos de seguros; inspeção e avaliação de riscos para cobertura de contratos de seguros; prevenção e gerência de riscos seguráveis e congêneres' },
      { id: '173', code: '19.01', description: 'Serviços de distribuição e venda de bilhetes e demais produtos de loteria, bingos, cartões, pules ou cupons de apostas, sorteios, prêmios, inclusive os decorrentes de títulos de capitalização e congêneres' },
      { id: '174', code: '20.01', description: 'Serviços portuários, ferroportuários, utilização de porto, movimentação de passageiros, reboque de embarcações, rebocador escoteiro, atracação, desatracação, serviços de praticagem, capatazia, armazenagem de qualquer natureza, serviços acessórios, movimentação de mercadorias, serviços de apoio marítimo, de movimentação ao largo, serviços de armadores, estiva, conferência, logística e congêneres' },
      { id: '175', code: '20.02', description: 'Serviços aeroportuários, utilização de aeroporto, movimentação de passageiros, armazenagem de qualquer natureza, capatazia, movimentação de aeronaves, serviços de apoio aeroportuários, serviços acessórios, movimentação de mercadorias, logística e congêneres' },
      { id: '176', code: '20.03', description: 'Serviços de terminais rodoviários, ferroviários, metroviários, movimentação de passageiros, mercadorias, inclusive suas operações, logística e congêneres' },
      { id: '177', code: '21.01', description: 'Serviços de registros públicos, cartorários e notariais' },
      { id: '178', code: '22.01', description: 'Serviços de exploração de rodovia mediante cobrança de preço ou pedágio dos usuários' },
      { id: '179', code: '23.01', description: 'Serviços de programação e comunicação visual, desenho industrial e congêneres' },
      { id: '180', code: '24.01', description: 'Serviços de chaveiros, confecção de carimbos, placas, sinalização visual, banners, adesivos e congêneres' },
      { id: '181', code: '25.01', description: 'Funerais, inclusive fornecimento de caixão, urna ou esquifes; aluguel de capela; transporte do corpo cadavérico; fornecimento de flores, coroas e outros paramentos; desembaraço de certidão de óbito; fornecimento de véu, essa e outros adornos; embalsamento, embelezamento, conservação ou restauração de cadáveres' },
      { id: '182', code: '25.02', description: 'Translado intramunicipal e cremação de corpos e partes de corpos cadavéricos' },
      { id: '183', code: '25.03', description: 'Planos ou convênio funerários' },
      { id: '184', code: '25.04', description: 'Manutenção e conservação de jazigos e cemitérios' },
      { id: '185', code: '25.05', description: 'Cessão de uso de espaços em cemitérios para sepultamento' },
      { id: '186', code: '26.01', description: 'Serviços de coleta, remessa ou entrega de correspondências, documentos, objetos, bens ou valores, inclusive pelos correios e suas agências franqueadas; courrier e congêneres' },
      { id: '187', code: '27.01', description: 'Serviços de assistência social' },
      { id: '188', code: '28.01', description: 'Serviços de avaliação de bens e serviços de qualquer natureza' },
      { id: '189', code: '29.01', description: 'Serviços de biblioteconomia' },
      { id: '190', code: '30.01', description: 'Serviços de biologia, biotecnologia e química' },
      { id: '191', code: '31.01', description: 'Serviços técnicos em edificações, eletrônica, eletrotécnica, mecânica, telecomunicações e congêneres' },
      { id: '192', code: '32.01', description: 'Serviços de desenhos técnicos' },
      { id: '193', code: '33.01', description: 'Serviços de desembaraço aduaneiro, comissários, despachantes e congêneres' },
      { id: '194', code: '34.01', description: 'Serviços de investigações particulares, detetives e congêneres' },
      { id: '195', code: '35.01', description: 'Serviços de reportagem, assessoria de imprensa, jornalismo e relações públicas' },
      { id: '196', code: '36.01', description: 'Serviços de meteorologia' },
      { id: '197', code: '37.01', description: 'Serviços de artistas, atletas, modelos e manequins' },
      { id: '198', code: '38.01', description: 'Serviços de museologia' },
      { id: '199', code: '39.01', description: 'Serviços de ourivesaria e lapidação (quando o material for fornecido pelo tomador do serviço)' },
      { id: '200', code: '40.01', description: 'Obras de arte sob encomenda' },
    ];
    if (!description) return all;
    const search = description.toLowerCase();
    return all.filter(s => s.description.toLowerCase().includes(search));
  }

  updateStatus(id, status) {
    const now = new Date().toISOString();
    const sets = ["status = ?", "updated_at = ?"];
    const params = [status, now];

    if (status === 'AUTHORIZED') {
      sets.push("number = ?");
      params.push(`NF-${Date.now()}`);
      sets.push("pdf_url = ?");
      params.push(`http://localhost:${8787}/__fake/nfse/${id}.pdf`);
      sets.push("xml_url = ?");
      params.push(`http://localhost:${8787}/__fake/nfse/${id}.xml`);
    }

    params.push(id);
    this.db.prepare(`UPDATE invoices SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }

  format(row) {
    if (!row) return null;
    return {
      object: 'invoice',
      id: row.id,
      status: row.status,
      type: row.type,
      payment: row.payment_id,
      customer: row.customer_id,
      serviceDescription: row.service_description,
      observations: row.observations,
      value: centsToDecimal(row.value),
      deductions: centsToDecimal(row.deductions),
      effectiveDate: row.effective_date,
      externalReference: row.external_reference,
      issRetained: !!row.iss_retained,
      municipalServiceId: row.municipal_service_id,
      municipalServiceCode: row.municipal_service_code,
      municipalServiceName: row.municipal_service_name,
      taxes: row.taxes ? JSON.parse(row.taxes) : null,
      number: row.number,
      rpsSerie: row.rpsSerie,
      rpsNumber: row.rpsNumber,
      pdfUrl: row.pdf_url,
      xmlUrl: row.xml_url,
      dateCreated: row.created_at,
    };
  }
}
