type ProtoStruct = { fields?: Record<string, ProtoValue> };
type ProtoList = { values?: ProtoValue[] };
type ProtoValue = {
  nullValue?: number;
  numberValue?: number;
  stringValue?: string;
  boolValue?: boolean;
  structValue?: ProtoStruct;
  listValue?: ProtoList;
};

export function toProtoStruct(value: unknown): ProtoStruct {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { fields: {} };
  }

  return {
    fields: Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        toProtoValue(item),
      ]),
    ),
  };
}

export function fromProtoStruct(value: unknown): unknown {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const protoStruct = value as ProtoStruct;
  if (!protoStruct.fields) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(protoStruct.fields).map(([key, item]) => [
      key,
      fromProtoValue(item),
    ]),
  );
}

export function unwrapObjectResponse(response: any) {
  return fromProtoStruct(response?.data);
}

export function unwrapListResponse(response: any) {
  return { items: (response?.items ?? []).map((item: unknown) => fromProtoStruct(item)) };
}

export function unwrapPageResponse(response: any) {
  return {
    items: (response?.items ?? []).map((item: unknown) => fromProtoStruct(item)),
    pagination: response?.pagination,
  };
}

function toProtoValue(value: unknown): ProtoValue {
  if (value === null || value === undefined) return { nullValue: 0 };
  if (value instanceof Date) return { stringValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { listValue: { values: value.map((item) => toProtoValue(item)) } };
  }

  switch (typeof value) {
    case 'number':
      return { numberValue: value };
    case 'string':
      return { stringValue: value };
    case 'boolean':
      return { boolValue: value };
    case 'object':
      return { structValue: toProtoStruct(value) };
    default:
      return { stringValue: String(value) };
  }
}

function fromProtoValue(value: ProtoValue): unknown {
  if ('numberValue' in value) return value.numberValue;
  if ('stringValue' in value) return value.stringValue;
  if ('boolValue' in value) return value.boolValue;
  if ('structValue' in value) return fromProtoStruct(value.structValue);
  if ('listValue' in value) {
    return (value.listValue?.values ?? []).map((item) => fromProtoValue(item));
  }
  return null;
}
