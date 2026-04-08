import React from 'react';
import Alert from 'components/common/Alert/Alert';
import toast, { ToastType } from 'react-hot-toast';
import { ErrorResponse } from 'generated-sources';
import { getCurrentLocale, translateMessage } from 'lib/i18n';

interface ServerResponse {
  status: number;
  statusText: string;
  url?: string;
  message?: ErrorResponse['message'];
}
export type ToastTypes = ToastType | 'warning';

export const getResponse = async (
  response: Response
): Promise<ServerResponse> => {
  let body;
  try {
    body = await response.json();
  } catch (e) {
    // do nothing;
  }
  return {
    status: response.status,
    statusText: response.statusText,
    url: response.url,
    message: body?.message,
  };
};

interface AlertOptions {
  id?: string;
  title?: string;
  message: React.ReactNode;
}

export const showAlert = (
  type: ToastTypes,
  { title, message, id }: AlertOptions
) => {
  toast.custom(
    (t) => (
      <Alert
        title={title || ''}
        type={type}
        message={message}
        onDissmiss={() => toast.remove(t.id)}
      />
    ),
    { id }
  );
};

export const showSuccessAlert = (options: AlertOptions) => {
  const locale = getCurrentLocale();
  showAlert('success', {
    ...options,
    title: options.title || translateMessage('common.alert.success', undefined, locale),
  });
};

export const showServerError = async (
  response: Response,
  options?: AlertOptions
) => {
  const locale = getCurrentLocale();
  let body: Record<string, string> = {};
  try {
    body = await response.json();
  } catch (e) {
    // do nothing;
  }
  if (response.status) {
    showAlert('error', {
      id: response.url,
      title: `${response.status} ${response.statusText}`,
      message:
        body?.message ||
        translateMessage('errors.occurred', undefined, locale),
      ...options,
    });
  } else {
    showAlert('error', {
      id: 'server-error',
      title: translateMessage('errors.somethingWentWrong', undefined, locale),
      message: translateMessage('errors.occurred', undefined, locale),
      ...options,
    });
  }
};
