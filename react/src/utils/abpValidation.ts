type AbpValidationError = {
  message?: string;
  members?: string[];
};

type AbpErrorBody = {
  message?: string;
  details?: string;
  validationErrors?: AbpValidationError[];
};

type AbpResponseBody = {
  error?: AbpErrorBody;
  __abp?: boolean;
};

export type AbpValidationMap = Record<string, string[]>;

const GENERAL_MEMBER_KEY = '__general__';

const toKey = (value: string) => value.trim().toLowerCase();

const tryGetAbpResponseBody = (input: unknown): AbpResponseBody | undefined => {
  const record = input as {
    response?: { data?: unknown };
    data?: unknown;
    error?: unknown;
    __abp?: boolean;
  };

  const responseData = record?.response?.data as AbpResponseBody | undefined;
  if (responseData?.error || responseData?.__abp) {
    return responseData;
  }

  const data = record?.data as AbpResponseBody | undefined;
  if (data?.error || data?.__abp) {
    return data;
  }

  if (record?.error || record?.__abp) {
    return record as AbpResponseBody;
  }

  return undefined;
};

const pushMapMessage = (map: AbpValidationMap, memberKey: string, message: string) => {
  const next = map[memberKey] ?? [];
  next.push(message);
  map[memberKey] = next;
};

export const getAbpValidationMap = (input: unknown): AbpValidationMap => {
  const body = tryGetAbpResponseBody(input);
  const validationErrors = body?.error?.validationErrors;
  if (!validationErrors || validationErrors.length === 0) {
    return {};
  }

  const map: AbpValidationMap = {};

  for (const validationError of validationErrors) {
    const message = validationError?.message?.trim();
    if (!message) continue;

    const members = (validationError.members ?? []).map(toKey).filter(Boolean);
    if (members.length === 0) {
      pushMapMessage(map, GENERAL_MEMBER_KEY, message);
      continue;
    }

    for (const member of members) {
      pushMapMessage(map, member, message);
    }
  }

  return map;
};

export const getAbpValidationMessageForMember = (
  input: unknown,
  member: string
): string | undefined => {
  const validationMap = getAbpValidationMap(input);
  const memberKey = toKey(member);

  const direct = validationMap[memberKey]?.[0];
  if (direct) return direct;

  const dotted = Object.entries(validationMap).find(([key]) =>
    key.endsWith(`.${memberKey}`)
  )?.[1]?.[0];
  if (dotted) return dotted;

  return undefined;
};

export const getAbpErrorMessage = (input: unknown): string => {
  const body = tryGetAbpResponseBody(input);
  const validationMap = getAbpValidationMap(input);

  const firstValidationMessage =
    Object.values(validationMap).find((messages) => messages.length > 0)?.[0] ??
    body?.error?.validationErrors?.find((item) => item.message?.trim())?.message?.trim();

  const message = body?.error?.message?.trim();
  const details = body?.error?.details?.trim();
  const fallback = (input as { message?: string })?.message?.trim();

  return message || firstValidationMessage || details || fallback || 'Something went wrong. Please try again.';
};
