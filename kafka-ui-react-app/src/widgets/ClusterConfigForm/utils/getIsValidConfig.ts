import { ApplicationConfigValidation } from 'generated-sources';
import { showAlert } from 'lib/errorHandling';

type Translator = (
  key: string,
  params?: Record<string, string | number>
) => string;

export const getIsValidConfig = (
  { clusters }: ApplicationConfigValidation,
  name: string,
  t: Translator
) => {
  let isValid = true;
  const prefix = `cluster-${name}`;
  const clusterErrors = clusters?.[name];

  if (clusterErrors?.kafka?.error) {
    isValid = false;
    showAlert('error', {
      id: `${prefix}-kafka`,
      title: t('clusterConfig.kafkaCluster.title'),
      message: clusterErrors?.kafka.errorMessage,
    });
  }
  if (clusterErrors?.schemaRegistry?.error) {
    isValid = false;
    showAlert('error', {
      id: `${prefix}-schemaRegistry`,
      title: t('clusterConfig.schemaRegistry.title'),
      message: clusterErrors?.schemaRegistry.errorMessage,
    });
  }
  if (clusterErrors?.ksqldb?.error) {
    isValid = false;
    showAlert('error', {
      id: `${prefix}-ksqldb`,
      title: t('clusterConfig.ksql.title'),
      message: clusterErrors?.ksqldb?.errorMessage,
    });
  }
  if (clusterErrors?.kafkaConnects) {
    Object.entries(clusterErrors.kafkaConnects).forEach(([key, val]) => {
      if (val?.error) {
        isValid = false;
        showAlert('error', {
          id: `${prefix}-kafkaConnects-${key}`,
          title: `${t('clusterConfig.kafkaConnect.title')}. ${key}`,
          message: val.errorMessage,
        });
      }
    });
  }
  return isValid;
};
