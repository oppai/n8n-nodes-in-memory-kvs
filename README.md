![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-in-memory-kvs

This is an n8n community node. It lets you use In-Memory Key-Value Store (KVS) in your n8n workflows.

In-Memory KVS is a memory-based key-value store for temporarily storing and retrieving data during workflow execution. You can control data persistence with different scopes (workflow, instance, execution).

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

**📖 [日本語版README](README_ja.md)**

[Installation](#installation)  
[Operations](#operations)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This node supports the following operations:

- **Set**: Set a value for a key
- **Get**: Get a value by key
- **Delete**: Delete a value by key
- **Clear**: Clear all values in a specified scope

### Scopes

Three scopes are available to control data persistence:

- **Workflow**: Data persists across workflow executions
- **Instance**: Data is shared across all workflows in this n8n instance
- **Execution**: Data is only available during the current workflow execution

### Features

- **JSON Support**: Parse and store values as JSON
- **TTL (Time To Live)**: Set expiration time for values (in seconds)
- **Default Values**: Specify default values when keys don't exist
- **Error Handling**: Control error handling with continue-on-fail option

## Compatibility

- Minimum n8n version: 1.0.0
- Node.js: 20.15 or higher

## Usage

### Basic Examples

1. **Setting a value**:
   - Operation: `Set`
   - Scope: `workflow`
   - Key: `user_count`
   - Value: `100`

2. **Getting a value**:
   - Operation: `Get`
   - Scope: `workflow`
   - Key: `user_count`
   - Default Value: `0`

3. **Storing JSON data**:
   - Operation: `Set`
   - Key: `user_data`
   - Value: `{"name": "John", "age": 30}`
   - Parse Value as JSON: `true`

4. **Using TTL for temporary data**:
   - Operation: `Set`
   - Key: `temp_token`
   - Value: `abc123`
   - TTL (Seconds): `3600` (1 hour)

### Practical Use Cases

- **Data sharing between workflows**: Maintaining counters or configuration values
- **Temporary caching**: Storing API responses temporarily
- **Execution state management**: Tracking state during workflow execution
- **Configuration management**: Storing and retrieving dynamic configuration values

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [n8n workflow automation guide](https://docs.n8n.io/)

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
