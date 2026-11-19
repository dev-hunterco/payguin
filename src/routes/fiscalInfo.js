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
