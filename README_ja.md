# n8n-nodes-in-memory-kvs

[![Test](https://github.com/oppai/n8n-nodes-in-memory-kvs/actions/workflows/test.yml/badge.svg)](https://github.com/oppai/n8n-nodes-in-memory-kvs/actions/workflows/test.yml)
[![Publish to NPM](https://github.com/oppai/n8n-nodes-in-memory-kvs/actions/workflows/publish.yml/badge.svg)](https://github.com/oppai/n8n-nodes-in-memory-kvs/actions/workflows/publish.yml)
[![CodeQL](https://github.com/oppai/n8n-nodes-in-memory-kvs/actions/workflows/codeql.yml/badge.svg)](https://github.com/oppai/n8n-nodes-in-memory-kvs/actions/workflows/codeql.yml)
[![npm version](https://badge.fury.io/js/n8n-nodes-in-memory-kvs.svg)](https://badge.fury.io/js/n8n-nodes-in-memory-kvs)

これはn8nコミュニティノードです。n8nワークフロー内でIn-Memory Key-Value Store（KVS）を使用できます。

In-Memory KVSは、ワークフロー実行中にデータを一時的に保存・取得するためのメモリベースのキー・バリューストアです。異なるスコープ（ワークフロー、インスタンス、実行）でデータの永続性を制御できます。

[n8n](https://n8n.io/)は[フェアコードライセンス](https://docs.n8n.io/reference/license/)のワークフロー自動化プラットフォームです。

**📖 [English README](README.md)**

[インストール](#インストール)  
[操作](#操作)  
[互換性](#互換性)  
[使用方法](#使用方法)  
[リソース](#リソース)  

## インストール

n8nコミュニティノードドキュメントの[インストールガイド](https://docs.n8n.io/integrations/community-nodes/installation/)に従ってください。

## 操作

このノードは以下の操作をサポートしています：

- **Set**: キーに値を設定
- **Get**: キーから値を取得
- **Delete**: キーを削除
- **Clear**: 指定されたスコープ内のすべての値をクリア

### スコープ

データの永続性を制御するために、3つのスコープが利用可能です：

- **Workflow**: データはワークフロー実行間で永続化されます
- **Instance**: データはn8nインスタンス内のすべてのワークフローで共有されます
- **Execution**: データは現在のワークフロー実行中のみ利用可能です

### 機能

- **JSON サポート**: 値をJSONとして解析・保存可能
- **TTL（Time To Live）**: 値に有効期限を設定可能（秒単位）
- **デフォルト値**: キーが存在しない場合のデフォルト値を指定可能
- **エラーハンドリング**: 継続実行オプションでエラー時の処理を制御

## 互換性

- 最小n8nバージョン: 1.0.0
 - Node.js: 20.15以上

## 使用方法

### 基本的な使用例

1. **値の設定**:
   - Operation: `Set`
   - Scope: `workflow`
   - Key: `user_count`
   - Value: `100`

2. **値の取得**:
   - Operation: `Get`
   - Scope: `workflow`
   - Key: `user_count`
   - Default Value: `0`

3. **JSONデータの保存**:
   - Operation: `Set`
   - Key: `user_data`
   - Value: `{"name": "John", "age": 30}`
   - Parse Value as JSON: `true`

4. **TTLを使用した一時データ**:
   - Operation: `Set`
   - Key: `temp_token`
   - Value: `abc123`
   - TTL (Seconds): `3600` (1時間)

### 実用的なユースケース

- **ワークフロー間でのデータ共有**: カウンターや設定値の保持
- **一時的なキャッシュ**: API レスポンスの一時保存
- **実行状態の管理**: ワークフロー実行中の状態追跡
- **設定値の管理**: 動的な設定値の保存・取得

### 高度な使用例

#### カウンターの実装
```
// カウンターを増加
Operation: Get
Key: counter
Default Value: 0

// 取得した値に1を加算してセット
Operation: Set
Key: counter
Value: {{ $json.kvsResult + 1 }}
```

#### セッション管理
```
// セッションデータの保存
Operation: Set
Scope: instance
Key: session_{{ $json.userId }}
Value: {"loginTime": "{{ new Date().toISOString() }}", "permissions": ["read", "write"]}
Parse Value as JSON: true
TTL (Seconds): 7200 (2時間)
```

#### 一時的なレート制限
```
// リクエスト回数の記録
Operation: Set
Scope: instance
Key: rate_limit_{{ $json.clientIP }}
Value: {{ $json.requestCount }}
TTL (Seconds): 60 (1分)
```

## リソース

- [n8nコミュニティノードドキュメント](https://docs.n8n.io/integrations/#community-nodes)
- [n8nワークフロー自動化ガイド](https://docs.n8n.io/)
- [n8nノード開発ガイド](https://docs.n8n.io/integrations/creating-nodes/)

## ライセンス

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md) 
