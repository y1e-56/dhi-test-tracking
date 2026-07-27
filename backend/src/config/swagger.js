import swaggerJSDoc from 'swagger-jsdoc';

const PORT = process.env.PORT || 5000;

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'DHI Test Tracking API',
    version: '1.0.0',
    description: "API de gestion des campagnes de test, fonctionnalités, anomalies et équipes pour la plateforme DHI Logiciel.",
  },
  servers: [
    { url: `http://localhost:${PORT}/api`, description: 'Serveur local' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentification et gestion des utilisateurs' },
    { name: 'Projects', description: 'Gestion des projets' },
    { name: 'Campaigns', description: 'Gestion des campagnes de test' },
    { name: 'Features', description: 'Gestion des fonctionnalités' },
    { name: 'Anomalies', description: 'Gestion des anomalies et notifications' },
    { name: 'Tasks', description: 'Assignations et tâches' },
    { name: 'Teams', description: "Gestion des équipes et membres de campagne" },
    { name: 'Dashboard', description: 'Statistiques et historique' },
    { name: 'TestCases', description: 'Gestion des cas de test' },
    { name: 'Chat', description: 'Assistant conversationnel' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Une erreur est survenue' },
          error: { type: 'string', example: 'Détail de l\'erreur' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          email: { type: 'string', format: 'email', example: 'admin@test.fr' },
          first_name: { type: 'string', example: 'Admin' },
          last_name: { type: 'string', example: 'Principal' },
          role: { type: 'string', enum: ['admin', 'chef_testeur', 'tester', 'developer'], example: 'admin' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'DHI Logiciel' },
          description: { type: 'string', nullable: true },
          start_date: { type: 'string', format: 'date', nullable: true },
          end_date: { type: 'string', format: 'date', nullable: true },
          is_archived: { type: 'boolean', example: false },
          created_by: { type: 'integer', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          test_lead_ids: { type: 'array', items: { type: 'integer' } },
        },
      },
      Campaign: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          project_id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Campagne Exploratoire V1' },
          objective: { type: 'string', nullable: true },
          organization_mode: { type: 'string', enum: ['exploratory', 'scenario', 'combination'] },
          start_date: { type: 'string', format: 'date', nullable: true },
          end_date: { type: 'string', format: 'date', nullable: true },
          status: { type: 'string', enum: ['planning', 'in_progress', 'completed', 'archived'] },
          test_leads: { type: 'array', items: { type: 'integer' } },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Feature: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          campaign_id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Authentification' },
          description: { type: 'string', nullable: true },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          status: { type: 'string', enum: ['pending', 'conforme', 'anomaly_detected'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      TestCase: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          feature_id: { type: 'integer', nullable: true },
          campaign_id: { type: 'integer', nullable: true },
          name: { type: 'string', example: 'TC-LOGIN-001' },
          description: { type: 'string', nullable: true },
          expected_result: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Anomaly: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          feature_id: { type: 'integer' },
          campaign_id: { type: 'integer' },
          test_case_id: { type: 'integer', nullable: true },
          description: { type: 'string' },
          reported_by: { type: 'integer', nullable: true },
          assigned_to: { type: 'integer', nullable: true },
          status: { type: 'string', enum: ['new', 'in_progress', 'resolution_signaled', 'validated', 'rejected'] },
          resolution_description: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Assignment: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          feature_id: { type: 'integer' },
          assigned_to: { type: 'integer' },
          assigned_at: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          notified_user_id: { type: 'integer' },
          anomaly_id: { type: 'integer', nullable: true },
          notification_type: { type: 'string' },
          description: { type: 'string', nullable: true },
          link_url: { type: 'string', nullable: true },
          is_read: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      PaginatedResult: {
        type: 'object',
        properties: {
          data: { type: 'array', items: {} },
          total: { type: 'integer', example: 42 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          totalPages: { type: 'integer', example: 3 },
        },
      },
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Numéro de page (active la pagination)',
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 200, default: 20 },
        description: "Nombre d'éléments par page",
      },
    },
    responses: {
      Unauthorized: {
        description: 'Authentification requise ou token invalide',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/Error' } },
        },
      },
      Forbidden: {
        description: 'Accès refusé (rôle insuffisant)',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/Error' } },
        },
      },
      NotFound: {
        description: 'Ressource introuvable',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/Error' } },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
