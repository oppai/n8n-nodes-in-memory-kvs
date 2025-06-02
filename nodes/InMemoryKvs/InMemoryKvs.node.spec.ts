import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { InMemoryKvs } from '../src/nodes/InMemoryKvs.node';
import { KVSEngine } from '../src/core/KVSEngine';

// n8nノードのモック
jest.mock('n8n-workflow', () => {
  return {
    NodeOperationError: jest.fn().mockImplementation((node, message) => {
      return new Error(message);
    }),
  };
});

describe('InMemoryKvs Node', () => {
  let node: InMemoryKvs;
  let executeFunctions: IExecuteFunctions;
  let kvsEngine: KVSEngine;

  beforeEach(() => {
    // KVSエンジンをリセット
    kvsEngine = KVSEngine.getInstance();
    kvsEngine.reset();

    // ノードインスタンスを作成
    node = new InMemoryKvs();

    // モックの実行関数を作成
    executeFunctions = {
      getInputData: jest.fn().mockReturnValue([{ json: { data: 'test' } }]),
      getNodeParameter: jest.fn(),
      getWorkflow: jest.fn().mockReturnValue({
        id: 'workflow-123',
      }),
      getNode: jest.fn().mockReturnValue({
        name: 'In-Memory KVS',
        type: 'inMemoryKvs',
      }),
      continueOnFail: jest.fn().mockReturnValue(false),
    } as unknown as IExecuteFunctions;
  });

  describe('set操作', () => {
    it('値を正常に設定できる', async () => {
      // パラメータのモック
      executeFunctions.getNodeParameter = jest.fn()
        .mockImplementation((paramName, itemIndex) => {
          if (paramName === 'operation') return 'set';
          if (paramName === 'scope') return 'workflow';
          if (paramName === 'key') return 'testKey';
          if (paramName === 'value') return 'testValue';
          if (paramName === 'jsonParse') return false;
          if (paramName === 'ttl') return 0;
          return undefined;
        });

      // 実行
      const result = await node.execute.call(executeFunctions);

      // 検証
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].json.kvsResult).toEqual({
        success: true,
        key: 'testKey',
        operation: 'set'
      });

      // 実際に値が設定されたか確認
      const storedValue = kvsEngine.get('workflow', 'workflow-123', 'testKey');
      expect(storedValue).toBe('testValue');
    });

    it('JSON値を解析して設定できる', async () => {
      // パラメータのモック
      executeFunctions.getNodeParameter = jest.fn()
        .mockImplementation((paramName, itemIndex) => {
          if (paramName === 'operation') return 'set';
          if (paramName === 'scope') return 'workflow';
          if (paramName === 'key') return 'jsonKey';
          if (paramName === 'value') return '{"name":"test","value":123}';
          if (paramName === 'jsonParse') return true;
          if (paramName === 'ttl') return 0;
          return undefined;
        });

      // 実行
      const result = await node.execute.call(executeFunctions);

      // 検証
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].json.kvsResult).toEqual({
        success: true,
        key: 'jsonKey',
        operation: 'set'
      });

      // 実際に値が設定されたか確認
      const storedValue = kvsEngine.get('workflow', 'workflow-123', 'jsonKey');
      expect(storedValue).toEqual({ name: 'test', value: 123 });
    });

    it('TTLを指定して値を設定できる', async () => {
      jest.useFakeTimers();

      // パラメータのモック
      executeFunctions.getNodeParameter = jest.fn()
        .mockImplementation((paramName, itemIndex) => {
          if (paramName === 'operation') return 'set';
          if (paramName === 'scope') return 'workflow';
          if (paramName === 'key') return 'ttlKey';
          if (paramName === 'value') return 'ttlValue';
          if (paramName === 'jsonParse') return false;
          if (paramName === 'ttl') return 5; // 5秒
          return undefined;
        });

      // 実行
      await node.execute.call(executeFunctions);

      // TTL期限前
      let storedValue = kvsEngine.get('workflow', 'workflow-123', 'ttlKey');
      expect(storedValue).toBe('ttlValue');

      // TTL期限後
      jest.advanceTimersByTime(6000); // 6秒進める
      storedValue = kvsEngine.get('workflow', 'workflow-123', 'ttlKey');
      expect(storedValue).toBeUndefined();

      jest.useRealTimers();
    });
  });

  describe('get操作', () => {
    it('設定した値を取得できる', async () => {
      // 事前に値を設定
      kvsEngine.set('workflow', 'workflow-123', 'getKey', 'getValue');

      // パラメータのモック
      executeFunctions.getNodeParameter = jest.fn()
        .mockImplementation((paramName, itemIndex) => {
          if (paramName === 'operation') return 'get';
          if (paramName === 'scope') return 'workflow';
          if (paramName === 'key') return 'getKey';
          if (paramName === 'defaultValue') return '';
          if (paramName === 'jsonParseDefault') return false;
          return undefined;
        });

      // 実行
      const result = await node.execute.call(executeFunctions);

      // 検証
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].json.kvsResult).toBe('getValue');
    });

    it('存在しないキーの場合はデフォルト値を返す', async () => {
      // パラメータのモック
      executeFunctions.getNodeParameter = jest.fn()
        .mockImplementation((paramName, itemIndex) => {
          if (paramName === 'operation') return 'get';
          if (paramName === 'scope') return 'workflow';
          if (paramName === 'key') return 'nonExistentKey';
          if (paramName === 'defaultValue') return 'defaultValue';
          if (paramName === 'jsonParseDefault') return false;
          return undefined;
        });

      // 実行
      const result = await node.execute.call(executeFunctions);

      // 検証
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].json.kvsResult).toBe('defaultValue');
    });
  });

  describe('delete操作', () => {
    it('値を削除できる', async () => {
      // 事前に値を設定
      kvsEngine.set('workflow', 'workflow-123', 'deleteKey', 'deleteValue');

      // パラメータのモック
      executeFunctions.getNodeParameter = jest.fn()
        .mockImplementation((paramName, itemIndex) => {
          if (paramName === 'operation') return 'delete';
          if (paramName === 'scope') return 'workflow';
          if (paramName === 'key') return 'deleteKey';
          return undefined;
        });

      // 実行
      const result = await node.execute.call(executeFunctions);

      // 検証
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].json.kvsResult).toEqual({
        success: true,
        key: 'deleteKey',
        operation: 'delete'
      });

      // 実際に値が削除されたか確認
      const storedValue = kvsEngine.get('workflow', 'workflow-123', 'deleteKey');
      expect(storedValue).toBeUndefined();
    });
  });

  describe('clear操作', () => {
    it('特定スコープの全ての値をクリアできる', async () => {
      // 事前に複数の値を設定
      kvsEngine.set('workflow', 'workflow-123', 'key1', 'value1');
      kvsEngine.set('workflow', 'workflow-123', 'key2', 'value2');

      // パラメータのモック
      executeFunctions.getNodeParameter = jest.fn()
        .mockImplementation((paramName, itemIndex) => {
          if (paramName === 'operation') return 'clear';
          if (paramName === 'scope') return 'workflow';
          return undefined;
        });

      // 実行
      const result = await node.execute.call(executeFunctions);

      // 検証
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].json.kvsResult).toEqual({
        success: true,
        operation: 'clear',
        scope: 'workflow'
      });

      // 実際に値がクリアされたか確認
      expect(kvsEngine.get('workflow', 'workflow-123', 'key1')).toBeUndefined();
      expect(kvsEngine.get('workflow', 'workflow-123', 'key2')).toBeUndefined();
    });
  });

  describe('スコープ管理', () => {
    it('異なるスコープ間でデータが分離される', async () => {
      // ワークフロースコープに値を設定
      executeFunctions.getNodeParameter = jest.fn()
        .mockImplementation((paramName, itemIndex) => {
          if (paramName === 'operation') return 'set';
          if (paramName === 'scope') return 'workflow';
          if (paramName === 'key') return 'scopeKey';
          if (paramName === 'value') return 'workflowValue';
          if (paramName === 'jsonParse') return false;
          if (paramName === 'ttl') return 0;
          return undefined;
        });

      await node.execute.call(executeFunctions);

      // インスタンススコープに同じキーで異なる値を設定
      executeFunctions.getNodeParameter = jest.fn()
        .mockImplementation((paramName, itemIndex) => {
          if (paramName === 'operation') return 'set';
          if (paramName === 'scope') return 'instance';
          if (paramName === 'key') return 'scopeKey';
          if (paramName === 'value') return 'instanceValue';
          if (paramName === 'jsonParse') return false;
          if (paramName === 'ttl') return 0;
          return undefined;
        });

      await node.execute.call(executeFunctions);

      // 各スコープから値を取得して確認
      expect(kvsEngine.get('workflow', 'workflow-123', 'scopeKey')).toBe('workflowValue');
      expect(kvsEngine.get('instance', null, 'scopeKey')).toBe('instanceValue');
    });
  });
});
