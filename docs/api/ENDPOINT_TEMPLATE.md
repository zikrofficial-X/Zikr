## [METHOD] /api/[path]

**Description:** [What this endpoint does]
**Authentication:** [Required / Optional / None]
**Authorization:** [Role or permission]

### Request

#### Headers
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer <token> |
| Content-Type | Yes | application/json |

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Resource identifier |

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 20 | Maximum results to return |
| offset | number | 0 | Number of results to skip |

#### Request Body
```typescript
interface RequestBody {
  field1: string;   // Description
  field2?: number;  // Optional field
}
```

```json
{
  "field1": "example value",
  "field2": 42
}
```

### Responses

#### 200 OK
```json
{
  "id": "uuid",
  "field1": "value"
}
```

#### Error Responses
| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | INVALID_INPUT | Request validation failed |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource does not exist |
| 500 | INTERNAL_ERROR | Unexpected server error |

### Notes
- [Any additional notes, rate limits, deprecation warnings, etc.]
