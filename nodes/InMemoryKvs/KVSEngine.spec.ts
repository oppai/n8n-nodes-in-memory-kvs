import { KVSEngine, KVSScope } from '../src/core/KVSEngine';

describe('KVSEngine', () => {
  let kvsEngine: KVSEngine;

  beforeEach(() => {
    // テスト前にエンジンをリセット
    kvsEngine = KVSEngine.getInstance();
    kvsEngine.reset();
  });

  describe('シングルトンパターン', () => {
    it('getInstance()は常に同じインスタンスを返す', () => {
      const instance1 = KVSEngine.getInstance();
      const instance2 = KVSEngine.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('基本操作: set, get, delete', () => {
    it('値を設定して取得できる', () => {
      const scope: KVSScope = 'workflow';
      const scopeId = 'workflow-123';
      const key = 'testKey';
      const value = { test: 'value' };

      kvsEngine.set(scope, scopeId, key, value);
      const result = kvsEngine.get(scope, scopeId, key);

      expect(result).toEqual(value);
    });

    it('存在しないキーはundefinedを返す', () => {
      const scope: KVSScope = 'workflow';
      const scopeId = 'workflow-123';
      const key = 'nonExistentKey';

      const result = kvsEngine.get(scope, scopeId, key);

      expect(result).toBeUndefined();
    });

    it('デフォルト値を指定すると存在しないキーの場合にデフォルト値を返す', () => {
      const scope: KVSScope = 'workflow';
      const scopeId = 'workflow-123';
      const key = 'nonExistentKey';
      const defaultValue = 'default';

      const result = kvsEngine.get(scope, scopeId, key, defaultValue);

      expect(result).toBe(defaultValue);
    });

    it('値を削除できる', () => {
      const scope: KVSScope = 'workflow';
      const scopeId = 'workflow-123';
      const key = 'testKey';
      const value = 'testValue';

      kvsEngine.set(scope, scopeId, key, value);
      const deleteResult = kvsEngine.delete(scope, scopeId, key);
      const getResult = kvsEngine.get(scope, scopeId, key);

      expect(deleteResult).toBe(true);
      expect(getResult).toBeUndefined();
    });

    it('存在しないキーを削除しようとするとfalseを返す', () => {
      const scope: KVSScope = 'workflow';
      const scopeId = 'workflow-123';
      const key = 'nonExistentKey';

      const result = kvsEngine.delete(scope, scopeId, key);

      expect(result).toBe(false);
    });
  });

  describe('TTL機能', () => {
    it('TTLを指定すると期限切れ後にundefinedを返す', () => {
      jest.useFakeTimers();
      
      const scope: KVSScope = 'workflow';
      const scopeId = 'workflow-123';
      const key = 'ttlKey';
      const value = 'ttlValue';
      const ttl = 5; // 5秒

      kvsEngine.set(scope, scopeId, key, value, ttl);
      
      // TTL期限前
      expect(kvsEngine.get(scope, scopeId, key)).toBe(value);
      
      // TTL期限後（5秒以上経過）
      jest.advanceTimersByTime(6000); // 6秒進める
      
      expect(kvsEngine.get(scope, scopeId, key)).toBeUndefined();
      
      jest.useRealTimers();
    });

    it('TTLを指定しない場合は無期限', () => {
      jest.useFakeTimers();
      
      const scope: KVSScope = 'workflow';
      const scopeId = 'workflow-123';
      const key = 'noTtlKey';
      const value = 'noTtlValue';

      kvsEngine.set(scope, scopeId, key, value);
      
      // 長時間経過しても値は保持される
      jest.advanceTimersByTime(1000 * 60 * 60 * 24 * 365); // 1年進める
      
      expect(kvsEngine.get(scope, scopeId, key)).toBe(value);
      
      jest.useRealTimers();
    });
  });

  describe('スコープ管理', () => {
    it('異なるワークフロースコープ間でデータは分離される', () => {
      const scope: KVSScope = 'workflow';
      const scopeId1 = 'workflow-123';
      const scopeId2 = 'workflow-456';
      const key = 'scopeKey';
      const value1 = 'value1';
      const value2 = 'value2';

      kvsEngine.set(scope, scopeId1, key, value1);
      kvsEngine.set(scope, scopeId2, key, value2);

      expect(kvsEngine.get(scope, scopeId1, key)).toBe(value1);
      expect(kvsEngine.get(scope, scopeId2, key)).toBe(value2);
    });

    it('異なるスコープタイプ間でデータは分離される', () => {
      const workflowScope: KVSScope = 'workflow';
      const instanceScope: KVSScope = 'instance';
      const executionScope: KVSScope = 'execution';
      
      const workflowId = 'workflow-123';
      const executionId = 'execution-123';
      
      const key = 'commonKey';
      const workflowValue = 'workflowValue';
      const instanceValue = 'instanceValue';
      const executionValue = 'executionValue';

      kvsEngine.set(workflowScope, workflowId, key, workflowValue);
      kvsEngine.set(instanceScope, null, key, instanceValue);
      kvsEngine.set(executionScope, executionId, key, executionValue);

      expect(kvsEngine.get(workflowScope, workflowId, key)).toBe(workflowValue);
      expect(kvsEngine.get(instanceScope, null, key)).toBe(instanceValue);
      expect(kvsEngine.get(executionScope, executionId, key)).toBe(executionValue);
    });
  });

  describe('clear操作', () => {
    it('特定のワークフロースコープをクリアできる', () => {
      const scope: KVSScope = 'workflow';
      const scopeId = 'workflow-123';
      const key1 = 'key1';
      const key2 = 'key2';

      kvsEngine.set(scope, scopeId, key1, 'value1');
      kvsEngine.set(scope, scopeId, key2, 'value2');
      
      kvsEngine.clear(scope, scopeId);
      
      expect(kvsEngine.get(scope, scopeId, key1)).toBeUndefined();
      expect(kvsEngine.get(scope, scopeId, key2)).toBeUndefined();
    });

    it('インスタンススコープをクリアできる', () => {
      const scope: KVSScope = 'instance';
      const key1 = 'key1';
      const key2 = 'key2';

      kvsEngine.set(scope, null, key1, 'value1');
      kvsEngine.set(scope, null, key2, 'value2');
      
      kvsEngine.clear(scope, null);
      
      expect(kvsEngine.get(scope, null, key1)).toBeUndefined();
      expect(kvsEngine.get(scope, null, key2)).toBeUndefined();
    });

    it('特定の実行スコープをクリアできる', () => {
      const scope: KVSScope = 'execution';
      const executionId = 'execution-123';
      const key1 = 'key1';
      const key2 = 'key2';

      kvsEngine.set(scope, executionId, key1, 'value1');
      kvsEngine.set(scope, executionId, key2, 'value2');
      
      kvsEngine.clear(scope, executionId);
      
      expect(kvsEngine.get(scope, executionId, key1)).toBeUndefined();
      expect(kvsEngine.get(scope, executionId, key2)).toBeUndefined();
    });
  });

  describe('実行スコープのクリーンアップ', () => {
    it('cleanupExecution()で特定の実行IDのデータをクリーンアップできる', () => {
      const scope: KVSScope = 'execution';
      const executionId = 'execution-123';
      const key = 'executionKey';

      kvsEngine.set(scope, executionId, key, 'value');
      
      kvsEngine.cleanupExecution(executionId);
      
      expect(kvsEngine.get(scope, executionId, key)).toBeUndefined();
    });
  });

  describe('エラーハンドリング', () => {
    it('ワークフロースコープでscopeIdがnullの場合はエラーを投げる', () => {
      const scope: KVSScope = 'workflow';
      const key = 'key';
      const value = 'value';

      expect(() => {
        kvsEngine.set(scope, null, key, value);
      }).toThrow('Workflow scope requires a workflow ID');
    });

    it('実行スコープでscopeIdがnullの場合はエラーを投げる', () => {
      const scope: KVSScope = 'execution';
      const key = 'key';
      const value = 'value';

      expect(() => {
        kvsEngine.set(scope, null, key, value);
      }).toThrow('Execution scope requires an execution ID');
    });
  });
});
