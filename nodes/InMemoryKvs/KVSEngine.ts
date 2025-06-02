import { IDataObject } from 'n8n-workflow';

// KVSデータの型定義
export interface KVSEntry {
  value: any;
  expireAt: number | null;
}

// KVSストアのスコープ型定義
export type KVSScope = 'workflow' | 'instance' | 'execution';

// KVSストアのデータ構造
interface KVSStore {
  workflow: {
    [workflowId: string]: {
      [key: string]: KVSEntry;
    };
  };
  instance: {
    [key: string]: KVSEntry;
  };
  execution: {
    [executionId: string]: {
      [key: string]: KVSEntry;
    };
  };
}

/**
 * インメモリKVSエンジン
 * シングルトンパターンで実装
 */
export class KVSEngine {
  private static instance: KVSEngine;
  private store: KVSStore;

  private constructor() {
    // ストア初期化
    this.store = {
      workflow: {},
      instance: {},
      execution: {},
    };
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): KVSEngine {
    if (!KVSEngine.instance) {
      KVSEngine.instance = new KVSEngine();
    }
    return KVSEngine.instance;
  }

  /**
   * 値を設定
   * @param scope スコープ
   * @param scopeId スコープID（workflowIdまたはexecutionId）
   * @param key キー
   * @param value 値
   * @param ttl TTL（秒）、指定しない場合は無期限
   */
  public set(scope: KVSScope, scopeId: string | null, key: string, value: any, ttl?: number): void {
    const expireAt = ttl ? Date.now() + ttl * 1000 : null;
    const entry: KVSEntry = { value, expireAt };

    if (scope === 'workflow') {
      if (!scopeId) throw new Error('Workflow scope requires a workflow ID');
      if (!this.store.workflow[scopeId]) {
        this.store.workflow[scopeId] = {};
      }
      this.store.workflow[scopeId][key] = entry;
    } else if (scope === 'instance') {
      this.store.instance[key] = entry;
    } else if (scope === 'execution') {
      if (!scopeId) throw new Error('Execution scope requires an execution ID');
      if (!this.store.execution[scopeId]) {
        this.store.execution[scopeId] = {};
      }
      this.store.execution[scopeId][key] = entry;
    }
  }

  /**
   * 値を取得
   * @param scope スコープ
   * @param scopeId スコープID（workflowIdまたはexecutionId）
   * @param key キー
   * @param defaultValue デフォルト値（キーが存在しない場合に返す値）
   * @returns 値またはデフォルト値
   */
  public get(scope: KVSScope, scopeId: string | null, key: string, defaultValue?: any): any {
    let entry: KVSEntry | undefined;

    if (scope === 'workflow') {
      if (!scopeId) throw new Error('Workflow scope requires a workflow ID');
      entry = this.store.workflow[scopeId]?.[key];
    } else if (scope === 'instance') {
      entry = this.store.instance[key];
    } else if (scope === 'execution') {
      if (!scopeId) throw new Error('Execution scope requires an execution ID');
      entry = this.store.execution[scopeId]?.[key];
    }

    // エントリが存在しない場合はデフォルト値を返す
    if (!entry) return defaultValue;

    // TTLチェック
    if (entry.expireAt !== null && entry.expireAt < Date.now()) {
      // 期限切れの場合は削除してデフォルト値を返す
      this.delete(scope, scopeId, key);
      return defaultValue;
    }

    return entry.value;
  }

  /**
   * 値を削除
   * @param scope スコープ
   * @param scopeId スコープID（workflowIdまたはexecutionId）
   * @param key キー
   * @returns 削除に成功したかどうか
   */
  public delete(scope: KVSScope, scopeId: string | null, key: string): boolean {
    if (scope === 'workflow') {
      if (!scopeId) throw new Error('Workflow scope requires a workflow ID');
      if (this.store.workflow[scopeId]?.[key]) {
        delete this.store.workflow[scopeId][key];
        return true;
      }
    } else if (scope === 'instance') {
      if (this.store.instance[key]) {
        delete this.store.instance[key];
        return true;
      }
    } else if (scope === 'execution') {
      if (!scopeId) throw new Error('Execution scope requires an execution ID');
      if (this.store.execution[scopeId]?.[key]) {
        delete this.store.execution[scopeId][key];
        return true;
      }
    }
    return false;
  }

  /**
   * 特定スコープのすべての値をクリア
   * @param scope スコープ
   * @param scopeId スコープID（workflowIdまたはexecutionId）
   */
  public clear(scope: KVSScope, scopeId: string | null): void {
    if (scope === 'workflow') {
      if (!scopeId) throw new Error('Workflow scope requires a workflow ID');
      this.store.workflow[scopeId] = {};
    } else if (scope === 'instance') {
      this.store.instance = {};
    } else if (scope === 'execution') {
      if (!scopeId) throw new Error('Execution scope requires an execution ID');
      this.store.execution[scopeId] = {};
    }
  }

  /**
   * 実行スコープのクリーンアップ
   * ワークフロー実行完了時に呼び出す
   * @param executionId 実行ID
   */
  public cleanupExecution(executionId: string): void {
    if (this.store.execution[executionId]) {
      delete this.store.execution[executionId];
    }
  }

  /**
   * テスト用：ストア全体をリセット
   */
  public reset(): void {
    this.store = {
      workflow: {},
      instance: {},
      execution: {},
    };
  }
}
