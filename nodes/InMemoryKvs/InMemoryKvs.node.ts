import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  NodeConnectionType,
} from 'n8n-workflow';

import { KVSEngine, KVSScope } from './KVSEngine';

export class InMemoryKvs implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'In-Memory KVS',
    name: 'inMemoryKvs',
    icon: 'file:kvs.svg',
    group: ['transform'],
    version: 1,
    description: 'Store and retrieve data in memory with different scopes',
    defaults: {
      name: 'In-Memory KVS',
    },
    // NodeConnectionType型を使用して型エラーを解消
    inputs: [{ type: NodeConnectionType.Main }],
    outputs: [{ type: NodeConnectionType.Main }],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Set',
            value: 'set',
            description: 'Set a value for a key',
            action: 'Set a value for a key',
          },
          {
            name: 'Get',
            value: 'get',
            description: 'Get a value by key',
            action: 'Get a value by key',
          },
          {
            name: 'Delete',
            value: 'delete',
            description: 'Delete a value by key',
            action: 'Delete a value by key',
          },
          {
            name: 'Clear',
            value: 'clear',
            description: 'Clear all values in a scope',
            action: 'Clear all values in a scope',
          },
        ],
        default: 'set',
        noDataExpression: true,
      },
      {
        displayName: 'Scope',
        name: 'scope',
        type: 'options',
        options: [
          {
            name: 'Workflow',
            value: 'workflow',
            description: 'Data persists across workflow executions',
          },
          {
            name: 'Instance',
            value: 'instance',
            description: 'Data is shared across all workflows in this n8n instance',
          },
          {
            name: 'Execution',
            value: 'execution',
            description: 'Data is only available during the current workflow execution',
          },
        ],
        default: 'workflow',
        noDataExpression: true,
      },
      {
        displayName: 'Key',
        name: 'key',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['set', 'get', 'delete'],
          },
        },
        placeholder: 'myKey',
        description: 'The key to set, get or delete',
      },
      {
        displayName: 'Value',
        name: 'value',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['set'],
          },
        },
        description: 'The value to set for the key (supports JSON)',
      },
      {
        displayName: 'Parse Value as JSON',
        name: 'jsonParse',
        type: 'boolean',
        default: false,
        displayOptions: {
          show: {
            operation: ['set'],
          },
        },
        description: 'Whether to parse the value as JSON',
      },
      {
        displayName: 'TTL (Seconds)',
        name: 'ttl',
        type: 'number',
        default: 0,
        displayOptions: {
          show: {
            operation: ['set'],
          },
        },
        description: 'Time to live in seconds (0 = no expiration)',
      },
      {
        displayName: 'Default Value',
        name: 'defaultValue',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['get'],
          },
        },
        description: 'Default value to return if key does not exist (supports JSON)',
      },
      {
        displayName: 'Parse Default Value as JSON',
        name: 'jsonParseDefault',
        type: 'boolean',
        default: false,
        displayOptions: {
          show: {
            operation: ['get'],
          },
        },
        description: 'Whether to parse the default value as JSON',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const kvsEngine = KVSEngine.getInstance();

    // 各アイテムに対して処理を実行
    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;
        const scope = this.getNodeParameter('scope', i) as KVSScope;

        // スコープIDの取得
        let scopeId: string | null = null;
        if (scope === 'workflow') {
          scopeId = this.getWorkflow().id?.toString() || null;
          if (!scopeId) {
            throw new NodeOperationError(this.getNode(), 'Could not determine workflow ID');
          }
        } else if (scope === 'execution') {
          scopeId = this.getWorkflow().id?.toString() || null;
          // 実行IDが取得できない場合はワークフローIDを使用
          if (!scopeId) {
            throw new NodeOperationError(this.getNode(), 'Could not determine execution ID');
          }
        }

        let result: any;

        if (operation === 'set') {
          const key = this.getNodeParameter('key', i) as string;
          let value = this.getNodeParameter('value', i) as string;
          const jsonParse = this.getNodeParameter('jsonParse', i) as boolean;
          const ttl = this.getNodeParameter('ttl', i) as number;

          // JSON解析が有効な場合は解析を試みる
          if (jsonParse) {
            try {
              value = JSON.parse(value);
            } catch (error) {
              // 型ガードを追加してエラーメッセージを安全に取得
              const errorMessage = error instanceof Error ? error.message : 'Unknown JSON parsing error';
              throw new NodeOperationError(this.getNode(), `Invalid JSON: ${errorMessage}`);
            }
          }

          // TTLが0の場合は無期限として扱う
          const ttlValue = ttl > 0 ? ttl : undefined;

          kvsEngine.set(scope, scopeId, key, value, ttlValue);
          result = { success: true, key, operation: 'set' };
        } else if (operation === 'get') {
          const key = this.getNodeParameter('key', i) as string;
          let defaultValue = this.getNodeParameter('defaultValue', i) as string;
          const jsonParseDefault = this.getNodeParameter('jsonParseDefault', i) as boolean;

          // デフォルト値のJSON解析
          if (jsonParseDefault && defaultValue) {
            try {
              defaultValue = JSON.parse(defaultValue);
            } catch (error) {
              // 型ガードを追加してエラーメッセージを安全に取得
              const errorMessage = error instanceof Error ? error.message : 'Unknown JSON parsing error';
              throw new NodeOperationError(this.getNode(), `Invalid JSON in default value: ${errorMessage}`);
            }
          }

          result = kvsEngine.get(scope, scopeId, key, defaultValue);
        } else if (operation === 'delete') {
          const key = this.getNodeParameter('key', i) as string;
          const success = kvsEngine.delete(scope, scopeId, key);
          result = { success, key, operation: 'delete' };
        } else if (operation === 'clear') {
          kvsEngine.clear(scope, scopeId);
          result = { success: true, operation: 'clear', scope };
        } else {
          throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`);
        }

        // 結果をアイテムに追加
        const newItem: INodeExecutionData = {
          json: {
            ...items[i].json,
            kvsResult: result,
          },
        };
        returnData.push(newItem);
      } catch (error) {
        if (this.continueOnFail()) {
          // 型ガードを追加してエラーメッセージを安全に取得
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          returnData.push({
            json: {
              error: errorMessage,
            },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
