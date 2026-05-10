import { toIsoString } from './date.mapper';
import { toGrpcPage } from './page.mapper';

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

export function fromProtoStruct(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const protoStruct = value as ProtoStruct;
  if (!protoStruct.fields) {
    return value as Record<string, unknown>;
  }

  return Object.fromEntries(
    Object.entries(protoStruct.fields).map(([key, item]) => [
      key,
      fromProtoValue(item),
    ]),
  );
}

export function toObjectResponse(value: unknown) {
  return { data: toProtoStruct(value) };
}

export function toListResponse(items: unknown[]) {
  return { items: items.map((item) => toProtoStruct(item)) };
}

export function toPageResponse(page: {
  items: unknown[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}) {
  return toGrpcPage(page as any, (item) => toProtoStruct(item));
}

function toProtoValue(value: unknown): ProtoValue {
  if (value === null || value === undefined) {
    return { nullValue: 0 };
  }

  if (value instanceof Date) {
    return { stringValue: toIsoString(value) };
  }

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
