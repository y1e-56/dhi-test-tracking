import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { paginate } from './paginate.js';

function makeMockClient({ countRows = [{ count: '42' }], dataRows = [{ id: 1 }] } = {}) {
  const calls = [];
  return {
    calls,
    async query(sql, params) {
      calls.push({ sql, params });
      if (calls.length === 1) return { rows: countRows };
      return { rows: dataRows };
    },
  };
}

describe('paginate', () => {
  test('utilise les valeurs par défaut (page 1, limit 20, tri created_at DESC)', async () => {
    const client = makeMockClient();
    const result = await paginate(client, 'SELECT COUNT(*)::int FROM items', 'SELECT * FROM items');

    assert.equal(result.pagination.page, 1);
    assert.equal(result.pagination.limit, 20);
    assert.equal(result.pagination.total, 42);
    assert.deepEqual(result.data, [{ id: 1 }]);

    const [countCall, dataCall] = client.calls;
    assert.equal(countCall.sql, 'SELECT COUNT(*)::int FROM items');
    assert.deepEqual(countCall.params, []);
    assert.equal(dataCall.sql, 'SELECT * FROM items ORDER BY created_at DESC LIMIT $1 OFFSET $2');
    assert.deepEqual(dataCall.params, [20, 0]);
  });

  test('respecte page, limit et orderBy personnalisés', async () => {
    const client = makeMockClient();
    const result = await paginate(
      client,
      'SELECT COUNT(*)::int FROM items',
      'SELECT * FROM items',
      [],
      { page: 3, limit: 10, orderBy: 'name ASC' }
    );

    assert.equal(result.pagination.page, 3);
    assert.equal(result.pagination.limit, 10);

    const dataCall = client.calls[1];
    assert.equal(dataCall.sql, 'SELECT * FROM items ORDER BY name ASC LIMIT $1 OFFSET $2');
    assert.deepEqual(dataCall.params, [10, 20]);
  });

  test('conserve les paramètres existants et décale les index LIMIT/OFFSET', async () => {
    const client = makeMockClient();
    await paginate(client, 'SELECT COUNT(*)::int FROM items WHERE x = $1', 'SELECT * FROM items WHERE x = $1', ['abc']);

    const [countCall, dataCall] = client.calls;
    assert.deepEqual(countCall.params, ['abc']);
    assert.equal(dataCall.sql, 'SELECT * FROM items WHERE x = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3');
    assert.deepEqual(dataCall.params, ['abc', 20, 0]);
  });

  test('clamp la page (minimum 1) et l\'arrondit', async () => {
    for (const raw of [0, -5, 1.9, 0.1]) {
      const client = makeMockClient();
      const result = await paginate(client, 'SELECT COUNT(*)::int FROM items', 'SELECT * FROM items', [], { page: raw });
      assert.ok(result.pagination.page >= 1, `page ${raw} doit être forcée à >= 1`);
      assert.equal(Number.isInteger(result.pagination.page), true);
    }
  });

  test('clamp le limit entre 1 et 200', async () => {
    const cases = [
      { raw: 0, expected: 1 },
      { raw: -10, expected: 1 },
      { raw: 2.9, expected: 2 },
      { raw: 500, expected: 200 },
      { raw: 200, expected: 200 },
    ];
    for (const { raw, expected } of cases) {
      const client = makeMockClient();
      const result = await paginate(client, 'SELECT COUNT(*)::int FROM items', 'SELECT * FROM items', [], { limit: raw });
      assert.equal(result.pagination.limit, expected, `limit ${raw} doit devenir ${expected}`);
    }
  });

  test('calcule totalPages avec arrondi supérieur, minimum 1', async () => {
    const cases = [
      { total: 0, limit: 20, expected: 1 },
      { total: 20, limit: 20, expected: 1 },
      { total: 21, limit: 20, expected: 2 },
      { total: 25, limit: 20, expected: 2 },
      { total: 40, limit: 20, expected: 2 },
      { total: 41, limit: 20, expected: 3 },
    ];
    for (const { total, limit, expected } of cases) {
      const client = makeMockClient({ countRows: [{ count: String(total) }] });
      const result = await paginate(client, 'SELECT COUNT(*)::int FROM items', 'SELECT * FROM items', [], { limit });
      assert.equal(result.pagination.totalPages, expected, `total ${total} / limit ${limit} -> ${expected} pages`);
    }
  });

  test('parse le count même sous forme de chaîne', async () => {
    const client = makeMockClient({ countRows: [{ count: '007' }] });
    const result = await paginate(client, 'SELECT COUNT(*)::int FROM items', 'SELECT * FROM items');
    assert.equal(result.pagination.total, 7);
  });

  test('gère un count nul ou absent', async () => {
    for (const countRows of [[{ count: null }], [{}], []]) {
      const client = makeMockClient({ countRows });
      const result = await paginate(client, 'SELECT COUNT(*)::int FROM items', 'SELECT * FROM items');
      assert.equal(result.pagination.total, 0);
    }
  });

  test('renvoie les données retournées par la requête', async () => {
    const dataRows = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
    const client = makeMockClient({ dataRows });
    const result = await paginate(client, 'SELECT COUNT(*)::int FROM items', 'SELECT * FROM items');
    assert.deepEqual(result.data, dataRows);
  });
});
